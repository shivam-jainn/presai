from collections import defaultdict
from typing import Any

from utils.embeddings import EmbeddingService
from utils.vectorstore import vector_store


def _compact_snippet(text: str, *, max_len: int = 220) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 1].rstrip() + "…"


def run_voice_slide_query(
    question: str,
    *,
    filename: str,
    session_id: str | None,
    top_k: int = 5,
) -> dict[str, Any]:
    cleaned_question = question.strip()
    if not cleaned_question:
        raise ValueError("Question cannot be empty.")

    embedding_service = EmbeddingService()
    query_vector = embedding_service.embed_query(cleaned_question)

    matches = vector_store.search_similar(
        query_vector=query_vector,
        limit=top_k,
        filename=filename,
        session_id=session_id,
    )
    if not matches:
        raise LookupError(
            "No matching slide content found. Ingest a deck first or ask a broader question."
        )

    slide_scores: dict[int, float] = defaultdict(float)
    for match in matches:
        slide_number = int(match.get("slide_number") or match.get("slide_id") or 1)
        slide_scores[slide_number] += float(match.get("score", 0.0))

    recommended_slide_number = max(slide_scores.items(), key=lambda item: item[1])[0]
    recommended_slide_index = max(recommended_slide_number - 1, 0)

    # Create a grounded answer from retrieved slide text (no LLM required).
    # Prefer chunks that belong to the recommended slide.
    slide_matches = [
        m
        for m in matches
        if int(m.get("slide_number") or m.get("slide_id") or 0) == recommended_slide_number
    ]
    best = (slide_matches or matches)[:2]
    snippets = [_compact_snippet(str(m.get("text") or "")) for m in best if (m.get("text") or "").strip()]
    if snippets:
        answer = f"Jumping to slide {recommended_slide_number}. Key points: " + " • ".join(snippets)
    else:
        answer = f"Jumping to slide {recommended_slide_number}."

    return {
        "answer": answer,
        "recommended_slide_number": recommended_slide_number,
        "recommended_slide_index": recommended_slide_index,
        "retrieval": matches,
    }