from minirag import MiniRAG
from minirag.utils import EmbeddingFunc
from typing import List, Dict, Any, Optional
import json
import os
import time
import threading
import asyncio
import warnings
import re
from pathlib import Path

import numpy as np
import requests
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Suppress MiniRAG graph warnings (clean console)
warnings.filterwarnings("ignore", category=UserWarning, module="minirag")

# ---------------- GEMINI SETUP ----------------

from google import genai

# 🔴 IMPORTANT: DO NOT hardcode key in real project
# Set once in terminal:
# setx GEMINI_API_KEY "YOUR_API_KEY"
load_dotenv()

# 🔴 IMPORTANT: DO NOT hardcode key in real project
# Set GEMINI_API_KEY in your environment or in a .env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Please set it in your environment before starting the backend.")

client = genai.Client(api_key=GEMINI_API_KEY)

# Try preferred model first, then fall back to broadly available free-tier models.
MODEL_CANDIDATES = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
]
MODEL_NAME = MODEL_CANDIDATES[0]

# ---------------- OLLAMA SETUP (FOR MINIRAG GRAPH) ----------------

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b-instruct-q4_K_M")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "600"))  # seconds


# --- Rate limiting: 1 request per minute ---
LAST_CALL = 0
MIN_INTERVAL = 30  # seconds
_rate_limit_lock = threading.Lock()

# Batching configuration for entity extraction (to reduce Gemini calls)
# Use a batch size of 1 to keep each Ollama request as small/fast as possible.
BATCH_SIZE = 1
BATCH_TIMEOUT = 3.0  # seconds to wait for more items before flushing

# internal batching state
_extraction_queue: List[tuple[str, asyncio.Future]] = []
_extraction_lock = asyncio.Lock()
_extraction_task: Optional[asyncio.Task] = None

# ---------------- EMBEDDING MODEL ----------------

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K = 5
TARGET_CHUNK_CHARS = 1800

embedding_model = SentenceTransformer(EMBED_MODEL)

async def embedding_func_impl(texts: List[str]) -> List[List[float]]:
    print(f"[EMBEDDING] Generating embeddings for {len(texts)} text(s)...")
    result = embedding_model.encode(texts, convert_to_tensor=False).tolist()
    print("[EMBEDDING] ✓ Embeddings generated")
    return result

embedding_func = EmbeddingFunc(
    embedding_dim=embedding_model.get_sentence_embedding_dimension(),
    max_token_size=512,
    func=embedding_func_impl
)

# ---------------- DISABLE ENTITY EXTRACTION ----------------

# ---------------- GEMINI-BASED ENTITY EXTRACTION ----------------

async def gemini_llm_func(prompt: str, **kwargs) -> str:
    """Batched Gemini extraction: queue the prompt and wait for
    the batch worker to call Gemini and return per-prompt results.
    Returns a JSON string: {"entities": [...], "keywords": [...]}.
    """
    global _extraction_task

    loop = asyncio.get_event_loop()
    fut: asyncio.Future = loop.create_future()

    # enqueue prompt and start worker if needed
    async with _extraction_lock:
        _extraction_queue.append((prompt, fut))
        if _extraction_task is None or _extraction_task.done():
            _extraction_task = asyncio.create_task(_batch_worker())

    # wait for result
    try:
        result = await fut
        return result
    except Exception:
        return json.dumps({"entities": [], "keywords": []})


async def _batch_worker():
    """Flush queued prompts in batches. Each batch is sent as one Gemini
    request which returns a JSON containing per-item results.
    """
    global _extraction_queue, _extraction_task, LAST_CALL

    while True:
        # wait a short period to allow batch to grow
        await asyncio.sleep(BATCH_TIMEOUT)

        async with _extraction_lock:
            if not _extraction_queue:
                _extraction_task = None
                return
            batch = _extraction_queue[:BATCH_SIZE]
            _extraction_queue = _extraction_queue[BATCH_SIZE:]

        prompts = [p for p, _ in batch]

        # build combined prompt
        combined = """
Extract entities and keywords for each numbered item. Respond ONLY with a JSON
object: {"results": [{"index":0,"entities": [...],"keywords":[...]}, ...]}

Items:
"""
        for i, p in enumerate(prompts):
            combined += f"\n--- ITEM {i} ---\n{p}\n"

        # Rate-limit global calls
        now = time.time()
        wait_time = MIN_INTERVAL - (now - LAST_CALL)
        if wait_time > 0:
            await asyncio.sleep(wait_time)

        # Call Ollama with retries/backoff (mainly defensive; local models
        # typically won't hit 429s, but we keep the logic symmetric).
        text = ""
        backoff = 1
        for attempt in range(4):
            try:
                print(
                    f"[BATCH] Attempt {attempt+1}: sending batch of {len(prompts)} prompts "
                    f"to Ollama (model={OLLAMA_MODEL})"
                )

                def _call_ollama() -> str:
                    resp = requests.post(
                        OLLAMA_URL,
                        json={
                            "model": OLLAMA_MODEL,
                            "prompt": combined,
                            "stream": False,
                        },
                        timeout=OLLAMA_TIMEOUT,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    return data.get("response", "") or ""

                text = await asyncio.get_event_loop().run_in_executor(
                    None,
                    _call_ollama,
                )

                print(f"[BATCH] ✓ Received response from Ollama (len={len(text)})")
                preview = text[:300].replace('\n', ' ')
                print(f"[BATCH] Response preview: {preview}")
                break
            except Exception as e:
                status = getattr(getattr(e, "response", None), "status_code", None)
                msg = str(e)
                if status == 429 or "429" in msg or "Too Many Requests" in msg:
                    print(f"[BATCH][WARN] Ollama rate limited (attempt {attempt+1}), sleeping {backoff}s")
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2, 30)
                    continue
                print(f"[BATCH][ERROR] Ollama batch error: {e}")
                break

        LAST_CALL = time.time()

        # parse response
        results_map = {}
        try:
            parsed = json.loads(text)
            # Expect either {"results": [...]}
            if isinstance(parsed, dict) and "results" in parsed and isinstance(parsed["results"], list):
                for item in parsed["results"]:
                    idx = item.get("index")
                    if idx is None:
                        continue
                    results_map[int(idx)] = {"entities": item.get("entities", []), "keywords": item.get("keywords", [])}
        except Exception:
            m = re.search(r"(\{.*\})", text, re.S)
            if m:
                try:
                    parsed = json.loads(m.group(1))
                    if isinstance(parsed, dict) and "results" in parsed and isinstance(parsed["results"], list):
                        for item in parsed["results"]:
                            idx = item.get("index")
                            if idx is None:
                                continue
                            results_map[int(idx)] = {"entities": item.get("entities", []), "keywords": item.get("keywords", [])}
                except Exception:
                    results_map = {}

        # set futures
        for i, (_, fut) in enumerate(batch):
            res = results_map.get(i, {"entities": [], "keywords": []})
            if not fut.done():
                # small debug: how many entities/keywords
                ent_count = len(res.get("entities", [])) if isinstance(res, dict) else 0
                kw_count = len(res.get("keywords", [])) if isinstance(res, dict) else 0
                print(f"[BATCH] Resolving future idx={i} entities={ent_count} keywords={kw_count}")
                fut.set_result(json.dumps(res))
# ---------------- ASYNC HELPER ----------------

def run_async(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

# ---------------- INITIALIZE MINIRAG ----------------

def init_minirag():
    print("[INIT] Initializing MiniRAG...")

    # Always resolve storage relative to the backend root so it
    # doesn't depend on the current working directory.
    backend_root = Path(__file__).resolve().parents[2]
    storage_dir = backend_root / "minirag_storage"

    os.makedirs(storage_dir, exist_ok=True)

    rag = MiniRAG(
        working_dir=str(storage_dir),
        chunk_token_size=900,
        chunk_overlap_token_size=150,
        embedding_func=embedding_func,
        llm_model_func=gemini_llm_func,
    )

    print("[INIT] ✓ MiniRAG initialized successfully")
    return rag

# ---------------- JSON → NATURAL LANGUAGE FORMATTER ----------------

def clean_text(text: str) -> str:
    # Remove contentReference[...] artifacts
    text = re.sub(r":contentReference\[.*?\]\{.*?\}", "", text)
    return text.strip()


def _normalize_group_name(value: str) -> str:
    normalized = re.sub(r"\s+", " ", str(value)).strip()
    return normalized if normalized else "general"


def _detect_group_from_dict(data: Dict[str, Any], fallback: Optional[str]) -> str:
    current = _normalize_group_name(fallback or "general")

    for key, value in data.items():
        key_str = str(key).strip().lower()
        if not isinstance(value, str):
            continue

        if re.search(r"(plant|crop)", key_str):
            candidate = _normalize_group_name(value)
            if candidate.lower() != "general":
                return candidate

    return current


def extract_text_from_json(
    data: Any,
    prefix: str = "",
    group_name: Optional[str] = None,
    depth: int = 0,
) -> List[Dict[str, str]]:
    records: List[Dict[str, str]] = []
    current_group = _normalize_group_name(group_name or "general")

    if isinstance(data, dict):
        detected_from_fields = _detect_group_from_dict(data, current_group)

        for key, value in data.items():
            key_str = str(key).strip()
            new_prefix = f"{prefix} {key_str}".strip()

            detected_group = detected_from_fields
            if depth == 0 and key_str:
                detected_group = _normalize_group_name(key_str)

            records.extend(
                extract_text_from_json(
                    value,
                    new_prefix,
                    detected_group,
                    depth + 1,
                )
            )

    elif isinstance(data, list):
        for item in data:
            records.extend(extract_text_from_json(item, prefix, current_group, depth + 1))

    elif isinstance(data, str):
        clean = clean_text(data)
        if not clean:
            return records

        sentence = f"{prefix}: {clean}" if prefix else clean
        records.append({
            "group": current_group,
            "text": sentence,
        })

    return records


def merge_into_large_chunks(records: List[Dict[str, str]], target_chars: int = TARGET_CHUNK_CHARS) -> List[str]:
    grouped: Dict[str, List[str]] = {}
    group_order: List[str] = []

    for item in records:
        group = (item.get("group") or "general").strip() or "general"
        text = (item.get("text") or "").strip()
        if not text:
            continue

        if group not in grouped:
            grouped[group] = []
            group_order.append(group)
        grouped[group].append(text)

    merged = []
    for group in group_order:
        current: List[str] = []
        current_len = 0
        header = f"Plant/Crop Group: {group}"

        for text in grouped[group]:
            add_len = len(text) + (1 if current else 0)
            if current and current_len + add_len > target_chars:
                merged.append(f"{header}\n" + "\n".join(current))
                current = [text]
                current_len = len(text)
            else:
                current.append(text)
                current_len += add_len

        if current:
            merged.append(f"{header}\n" + "\n".join(current))

    return merged


def load_json_file(file_path: str) -> List[str]:
    print(f"[LOAD] Loading JSON file: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = extract_text_from_json(data)
    large_chunks = merge_into_large_chunks(records)

    detected_groups = sorted({item["group"] for item in records if item.get("group")})
    print(f"[LOAD] ✓ Extracted {len(records)} raw text pieces from JSON")
    print(f"[LOAD] ✓ Auto-detected groups: {len(detected_groups)}")
    print(f"[LOAD] ✓ Merged into {len(large_chunks)} large chunks")
    return large_chunks


def add_json_files(rag: MiniRAG, json_paths: List[str]):
    print(f"\n[INSERT] Processing {len(json_paths)} JSON file(s)...")

    for i, path in enumerate(json_paths, 1):
        print(f"\n[INSERT] File {i}/{len(json_paths)}: {path}")

        texts = load_json_file(path)

        print(f"[INSERT] Inserting {len(texts)} texts into RAG system...")
        run_async(rag.ainsert(texts))

        print(f"[INSERT] ✓ Successfully inserted texts from {os.path.basename(path)}")
    
    # Final marker so you can easily see when all JSON ingestion is done
    print("\n[INSERT] \u2713 All JSON files ingested. You can now check minirag_storage.")

# ---------------- QUERY NORMALIZATION ----------------

def normalize_query(q: str) -> str:
    q = q.lower().strip()
    return f"rice {q}"   # boosts matching for crop queries

# ---------------- RETRIEVAL (FINAL FIXED VERSION) ----------------

def retrieve_with_minirag(rag, query: str, top_k: int = TOP_K) -> List[str]:
    print(f"\n[RETRIEVE] Searching for top {top_k} relevant chunks...")
    print(f"[RETRIEVE] Query: {query}")
    
    try:
        # Step 1: Generate embedding for query
        embeddings = run_async(embedding_func_impl([query]))
        query_embedding = np.array(embeddings[0], dtype=np.float32)
        print(f"[RETRIEVE] Generated query embedding (dim={len(query_embedding)})")

        # Step 2: Load vector DB (embeddings) and text chunks
        vdb_path = "./minirag_storage/vdb_chunks.json"
        text_path = "./minirag_storage/kv_store_text_chunks.json"
        if not os.path.exists(vdb_path) or not os.path.exists(text_path):
            print(f"[DEBUG] Missing storage files; vdb_chunks or kv_store_text_chunks not found")
            return []

        with open(vdb_path, "r", encoding="utf-8") as f:
            vdb_data = json.load(f)
        with open(text_path, "r", encoding="utf-8") as f:
            text_data = json.load(f)

        # Parse matrix embeddings (base64-encoded float32 array)
        if not isinstance(vdb_data, dict) or "data" not in vdb_data or "matrix" not in vdb_data:
            print("[DEBUG] Invalid vdb_chunks.json structure")
            return []

        ids = [item.get("__id__") for item in vdb_data["data"] if isinstance(item, dict)]
        matrix_b64 = vdb_data["matrix"]

        import base64
        matrix_bytes = base64.b64decode(matrix_b64)
        matrix = np.frombuffer(matrix_bytes, dtype=np.float32)
        dim = vdb_data.get("embedding_dim", len(query_embedding))
        if dim == 0:
            print("[DEBUG] embedding_dim is zero")
            return []
        rows = matrix.size // dim
        if rows == 0:
            print("[DEBUG] No embedding rows decoded")
            return []
        matrix = matrix.reshape((rows, dim))

        # Step 3: Compute similarities
        if len(ids) != rows:
            print(f"[DEBUG] ID count {len(ids)} != embedding rows {rows}")
        count = min(len(ids), rows)

        similarities = []
        for idx in range(count):
            cid = ids[idx]
            chunk_vec = matrix[idx]
            norm_q = np.linalg.norm(query_embedding)
            norm_c = np.linalg.norm(chunk_vec)
            if norm_q > 0 and norm_c > 0:
                sim = float(np.dot(query_embedding, chunk_vec) / (norm_q * norm_c))
            else:
                sim = 0.0

            content = None
            if cid and cid in text_data:
                content = text_data[cid].get("content")
            if not content:
                continue

            similarities.append((sim, content, cid))

        if not similarities:
            print("[DEBUG] No similarities computed (missing content?)")
            return []

        similarities.sort(key=lambda x: x[0], reverse=True)
        top_results = similarities[:top_k]

        chunks = [content for sim, content, cid in top_results]

        print(f"[RETRIEVE] ✓ Retrieved {len(chunks)} chunk(s)")
        for i, (sim, content, cid) in enumerate(top_results):
            preview = content[:100].replace("\n", " ") if len(content) > 100 else content
            print(f"  [Result {i+1}] Sim: {sim:.4f} | id={cid} | {preview}...")

        return chunks
    
    except Exception as e:
        print(f"[DEBUG] Retrieval error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    
    return []

# ---------------- GEMINI GENERATION ----------------

def gemini_generate(context: str, question: str) -> str:
    global LAST_CALL

    print("\n[GENERATE] Preparing to call Gemini API...")


    # --- Strict rate limiting: 1 request per minute ---
    global LAST_CALL
    with _rate_limit_lock:
        now = time.time()
        wait_time = MIN_INTERVAL - (now - LAST_CALL)
        if wait_time > 0:
            print(f"[RATE LIMIT] Waiting {wait_time:.1f} seconds...")
            time.sleep(wait_time)
        LAST_CALL = time.time()

    # Limit context size
    MAX_CONTEXT_CHARS = 3000
    context = context[:MAX_CONTEXT_CHARS]

    prompt = f"""
You are an agricultural assistant.

1) Prefer the context below as the primary source.
2) If the context is missing or does not contain enough information, answer using your own general agricultural knowledge.
3) When you use knowledge not found in the context, clearly mention that it is general guidance.
4) Keep answers practical, concise, and farmer-friendly.

Context:
{context}

Question:
{question}

Answer:
"""

    last_error = None

    for model_name in MODEL_CANDIDATES:
        try:
            print(f"[API CALL] Sending request to {model_name}...")

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )

            print(f"[API CALL] ✓ Response received from {model_name}")
            return response.text or "No response text received from Gemini."

        except Exception as e:
            last_error = e
            status_code = getattr(e, "status_code", None)
            message = getattr(e, "message", None) or str(e)
            response_text = ""

            resp_obj = getattr(e, "response", None)
            if resp_obj is not None:
                response_text = getattr(resp_obj, "text", "") or ""

            print(
                f"[API ERROR] model={model_name} status={status_code} message={message}"
                + (f" body={response_text}" if response_text else "")
            )

    raise RuntimeError(f"Gemini API failed for all fallback models. Last error: {last_error}")

# ---------------- FULL RAG QUERY ----------------

def rag_query(rag: MiniRAG, question: str) -> str:

    print("\n" + "=" * 60)
    print("[RAG QUERY] Starting RAG query")
    print("[RAG QUERY] Original question:", question)
    print("=" * 60)

    question_norm = normalize_query(question)

    retrieved_docs = retrieve_with_minirag(rag, question_norm, TOP_K)

    if not retrieved_docs:
        print("\n[RAG QUERY] ⚠ No relevant context found, falling back to model knowledge")
        answer = gemini_generate("", question)
        print("\n[RAG QUERY] ✓ Query completed with fallback knowledge")
        print("=" * 60 + "\n")
        return answer

    print("\n================ RETRIEVED CONTEXT ================\n")
    for i, doc in enumerate(retrieved_docs):
        print(f"[Chunk {i+1}]\n{doc[:500]}\n")
    print("===================================================\n")

    context = "\n\n".join(retrieved_docs)

    answer = gemini_generate(context, question)

    print("\n[RAG QUERY] ✓ Query completed successfully")
    print("=" * 60 + "\n")

    return answer
