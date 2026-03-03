from minirag import MiniRAG
from minirag.utils import EmbeddingFunc
from typing import List, Dict, Any, Optional
import json
import os
import time
import asyncio
import warnings
import re
import numpy as np
from sentence_transformers import SentenceTransformer

# Suppress MiniRAG graph warnings (clean console)
warnings.filterwarnings("ignore", category=UserWarning, module="minirag")

# ---------------- GEMINI SETUP ----------------

from google import genai

# 🔴 IMPORTANT: DO NOT hardcode key in real project
# Set once in terminal:
# setx GEMINI_API_KEY "YOUR_API_KEY"

client = genai.Client(api_key="AIzaSyDTIGD-9iLPayUsWHjlKSdMNyJf6GmHMKQ")

# Use only stable free-tier model
MODEL_NAME = "gemini-2.5-flash-lite"

LAST_CALL = 0
MIN_INTERVAL = 60   # 1 call per minute (safe for free tier)

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

async def gemini_llm_func_noop(prompt: str, **kwargs) -> str:
    return json.dumps({"entities": [], "keywords": []})

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

    os.makedirs("./minirag_storage", exist_ok=True)

    rag = MiniRAG(
        working_dir="./minirag_storage",
        chunk_token_size=900,
        chunk_overlap_token_size=150,
        embedding_func=embedding_func,
        llm_model_func=gemini_llm_func_noop
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

    # Rate limiting
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

    print(f"[API CALL] Sending request to {MODEL_NAME}...")

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    print("[API CALL] ✓ Response received from Gemini")
    return response.text

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
