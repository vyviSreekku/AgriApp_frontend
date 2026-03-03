from pathlib import Path
from threading import Lock
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.Embedding_and_Retrivel import init_minirag, add_json_files, rag_query

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

_rag_instance = None
_rag_lock = Lock()
_rag_initialized = False


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _dataset_paths() -> list[str]:
    root = _backend_root()
    files = [
        root / "app" / "dataset" / "pest.json",
        root / "app" / "dataset" / "weed.json",
        root / "app" / "dataset" / "village_plant_disease_dataset.json",
    ]
    return [str(path) for path in files if path.exists()]


def _get_rag():
    global _rag_instance, _rag_initialized

    if _rag_initialized and _rag_instance is not None:
        return _rag_instance

    with _rag_lock:
        if _rag_initialized and _rag_instance is not None:
            return _rag_instance

        rag = init_minirag()
        dataset_files = _dataset_paths()

        if not dataset_files:
            raise RuntimeError("No dataset files found for chatbot indexing")

        add_json_files(rag, dataset_files)

        _rag_instance = rag
        _rag_initialized = True

    return _rag_instance


class ChatbotQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)


class ChatbotQueryResponse(BaseModel):
    question: str
    answer: str


@router.get("/health")
def chatbot_health():
    return {"status": "ok", "service": "chatbot"}


@router.post("/query", response_model=ChatbotQueryResponse)
def chatbot_query(payload: ChatbotQueryRequest):
    question = payload.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        rag = _get_rag()
        answer = rag_query(rag, question)
        return ChatbotQueryResponse(question=question, answer=answer)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chatbot query failed: {exc}") from exc
