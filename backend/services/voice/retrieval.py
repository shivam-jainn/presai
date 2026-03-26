from __future__ import annotations

import json
import re
from typing import Any

from config import config
from utils.embeddings import EmbeddingService
from utils.logger import logger
from utils.vectorstore import vector_store

# ---------------------------------------------------------------------------
# Session state (in-memory, keyed by session_id)
# ---------------------------------------------------------------------------
_sessions: dict[str, dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# LLM helper (used only for final reranking)
# ---------------------------------------------------------------------------

def _get_llm_client():
    from openai import OpenAI
    llm_cfg = config.llm_config
    kwargs: dict[str, Any] = {"api_key": llm_cfg.get("api_key") or "nokey"}
    if llm_cfg.get("base_url"):
        kwargs["base_url"] = llm_cfg["base_url"]
    return OpenAI(**kwargs)


def _llm_json(system: str, user: str, *, max_tokens: int = 32) -> dict[str, Any]:
    """
    Single-turn LLM call in JSON mode.
    Always uses response_format={'type': 'json_object'}.
    Returns parsed dict or {} on any failure.
    """
    try:
        client = _get_llm_client()
        logger.info("LLM call: model=%s", config.LLM_MODEL_NAME)
        
        resp = client.chat.completions.create(
            model=config.LLM_MODEL_NAME,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            max_tokens=max_tokens,
            temperature=config.LLM_TEMPERATURE,
            response_format={"type": "json_object"},
        )
        raw = (resp.choices[0].message.content or "").strip()
        logger.info("LLM response: %s", raw)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("LLM call failed: %s", exc)
        return {}


# ---------------------------------------------------------------------------
# 1. Rule-based query normalization (no LLM)
# ---------------------------------------------------------------------------

_FILLER_WORDS = frozenset({
    "show", "me", "please", "can", "you", "go", "to", "display", "take",
    "the", "a", "an", "could", "would", "may", "might", "will", "look",
    "at", "tell", "about", "get", "give", "what", "how", "where", "why",
    "when", "is", "are", "do", "does", "let", "see", "find", "open",
})


def normalize_query(raw: str) -> str:
    """
    Strip filler words from the raw voice query using a rule-based approach.
    No LLM involved.

    temp_query  = raw
    normalised  = normalize_query(temp_query)
    """
    words = raw.lower().split()
    filtered = [w.rstrip(".,!?;:") for w in words if w.rstrip(".,!?;:") not in _FILLER_WORDS]
    result = " ".join(filtered) if filtered else raw
    return result


# ---------------------------------------------------------------------------
# 2. COMMAND detection (regex only — handles next / prev / goto N)
# ---------------------------------------------------------------------------

_COMMAND_PATTERNS = [
    re.compile(r"^(next|next\s+slide|next\s+one|forward|move\s+forward)$", re.I),
    re.compile(r"^(prev|previous|previous\s+slide|go\s+back|back|last\s+slide)$", re.I),
    re.compile(r"^(?:go\s+to\s+(?:slide\s+)?|slide\s+|jump\s+to\s+(?:slide\s+)?|number\s+)(\d+)$", re.I),
    re.compile(r"^\d+$"),
    re.compile(r"^to\s+(?:the\s+)?(?:next|previous|prev)\s*(?:slide)?$", re.I),
]


def _detect_command(query: str) -> bool:
    q = query.strip().rstrip(".,!?;:")
    for pat in _COMMAND_PATTERNS:
        if pat.match(q):
            return True
    return False


def _parse_command_slide(query: str, last_slide: int, total_slides: int) -> int | None:
    """Resolve a navigation command to an absolute 1-based slide number."""
    q = query.strip().rstrip(".,!?;:")
    logger.info("Command: '%s' | last=%d total=%d", q, last_slide, total_slides)

    if re.match(r"^(next|next\s+slide|next\s+one|forward|move\s+forward)$", q, re.I):
        target = min(last_slide + 1, total_slides) if total_slides else last_slide + 1
        logger.info("NEXT command → slide %d", target)
        return target

    if re.match(r"^(prev|previous|previous\s+slide|go\s+back|back|last\s+slide)$", q, re.I):
        target = max(last_slide - 1, 1)
        logger.info("PREV command → slide %d", target)
        return target

    m = re.match(
        r"^(?:go\s+to\s+(?:slide\s+)?|slide\s+|jump\s+to\s+(?:slide\s+)?|number\s+)?(\d+)$",
        q, re.I,
    )
    if m:
        n = int(m.group(1))
        if total_slides:
            n = min(n, total_slides)
        n = max(n, 1)
        logger.info("GOTO command → slide %d", n)
        return n

    return None


# ---------------------------------------------------------------------------
# 3. Hybrid scoring
#
#   exact keyword match  → vector_score × 3  (exact_similarity = 3)
#   no keyword match     → vector_score × 1  (semantic_similarity = 1)
# ---------------------------------------------------------------------------

_STOP_WORDS: frozenset[str] = frozenset({
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "about", "what", "which",
    "who", "whom", "this", "that", "these", "those", "i", "me", "my",
    "we", "our", "you", "your", "he", "his", "she", "her", "it", "its",
    "they", "their", "them", "with", "for", "from", "to", "of", "in",
    "on", "at", "by", "as", "or", "and", "but", "not", "if", "so",
    "show", "please", "go", "display", "take", "look", "tell", "get",
    "give", "how", "when", "where", "why", "let", "see", "up", "down",
})

EXACT_SIMILARITY_BOOST = 3.0
SEMANTIC_SIMILARITY    = 1.0


def _hybrid_score(vector_score: float, query_keywords: set[str], slide_text: str) -> float:
    """
    hybrid_scoring(normalised_query):
        db_result = db.get(normalised_query)          # done before calling this
        exact_similarity  = 3  (keyword found in text)
        semantic_similarity = 1  (no keyword hit)
        top_k = topKviaScore()                        # done after calling this
    """
    slide_words   = set(re.findall(r"\w+", slide_text.lower()))
    meaningful_kw = query_keywords - _STOP_WORDS

    if meaningful_kw and (meaningful_kw & slide_words):
        boosted = vector_score * EXACT_SIMILARITY_BOOST
        return boosted

    return vector_score * SEMANTIC_SIMILARITY


# ---------------------------------------------------------------------------
# 4. LLM reranker  →  {"slide_number": int}
# ---------------------------------------------------------------------------

_RERANK_SYSTEM = """\
You are a slide selector for a voice-controlled presentation system.

Given a user query and a list of candidate slides with their text content, select the ONE
slide that best answers the user's intent.

Rules:
- Prefer slides that directly name or describe the queried concept
- Focus on semantic meaning, not just keyword overlap
- Avoid generic slides (overview, demo flow) unless clearly the best match

You MUST respond with valid JSON matching this exact schema:
{"slide_number": <integer>}

Only return the JSON. Nothing else.
"""


def _llm_select_slide(query: str, candidates: list[dict[str, Any]]) -> int | None:
    """Inject top-K slide content → LLM returns {"slide_number": int}."""
    if not candidates:
        return None
    if len(candidates) == 1:
        sn = int(candidates[0].get("slide_number") or candidates[0].get("slide_id") or 1)
        logger.info("Single candidate — slide %d", sn)
        return sn

    lines = []
    for c in candidates:
        sn   = int(c.get("slide_number") or c.get("slide_id") or 0)
        text = " ".join(str(c.get("text", "")).split())[:250]
        lines.append(f"Slide {sn}: {text}")

    user_msg = (
        f"Query: {query}\n\n"
        f"Candidates:\n" + "\n".join(lines) +
        '\n\nReturn {"slide_number": <integer>}:'
    )
    logger.info("Reranker query over %d candidates", len(candidates))

    data   = _llm_json(_RERANK_SYSTEM, user_msg, max_tokens=32)
    chosen = data.get("slide_number")
    if chosen is not None:
        try:
            chosen = int(chosen)
            logger.info("LLM chose slide %d", chosen)
            return chosen
        except (ValueError, TypeError):
            pass

    logger.warning("LLM reranker returned no valid slide_number")
    return None


# ---------------------------------------------------------------------------
# 5. Main entry point
# ---------------------------------------------------------------------------

def run_voice_slide_query(
    question: str,
    *,
    filename: str,
    session_id: str | None,
    top_k: int = 3,
    current_slide: int | None = None,
    total_slides: int | None = None,
) -> dict[str, Any]:
    raw_question = question.strip()
    if not raw_question:
        raise ValueError("Question cannot be empty.")

    logger.info("Voice query: '%s' | file=%s session=%s", raw_question, filename, session_id or "none")

    # ── Session bootstrap ─────────────────────────────────────────────────
    sess_key = session_id or f"_nosession_{filename}"
    session  = _sessions.setdefault(sess_key, {"last_slide": current_slide or 1})
    if current_slide is not None:
        session["last_slide"] = current_slide
    last_slide: int = session["last_slide"]

    # ── Resolve total_slides ──────────────────────────────────────────────
    if total_slides is None:
        total_slides = vector_store.get_total_slides(filename, session_id)
        logger.info("Total slides resolved: %d", total_slides)

    # ── COMMAND branch (regex, no LLM) ────────────────────────────────────
    if _detect_command(raw_question):
        target = _parse_command_slide(raw_question, last_slide, total_slides)
        if target is not None:
            session["last_slide"] = target
            logger.info("COMMAND detected → slide %d", target)
            return {
                "answer": f"Jumping to slide {target}.",
                "recommended_slide_number": target,
                "recommended_slide_index": max(target - 1, 0),
                "retrieval": [],
                "intent": "COMMAND",
            }

    # ── SEARCH branch ─────────────────────────────────────────────────────
    # Step 1: rule-based normalization (no LLM)
    normalised_query = normalize_query(raw_question)

    # Step 2: embed normalised query → vector DB
    embedding_service = EmbeddingService()
    query_vector = embedding_service.embed_query(normalised_query)

    db_results = vector_store.search_similar(
        query_vector=query_vector,
        limit=max(top_k * 2, 6),     # fetch buffer for scoring
        filename=filename,
        session_id=session_id,
    )

    if not db_results:
        logger.error("No matches in vector store")
        raise LookupError(
            "No matching slide content found. Ingest a deck first or ask a broader question."
        )

    logger.info("DB results: %d slides retrieved", len(db_results))

    # Step 3: hybrid scoring
    # keywords = union of raw + normalised so nothing meaningful is dropped
    query_keywords = (
        set(re.findall(r"\w+", normalised_query.lower()))
        | set(re.findall(r"\w+", raw_question.lower()))
    )
    for r in db_results:
        r["_hybrid_score"] = _hybrid_score(
            float(r.get("score", 0.0)), query_keywords, str(r.get("text", ""))
        )

    # Step 4: top_k by hybrid score
    top_k_results = sorted(db_results, key=lambda r: r["_hybrid_score"], reverse=True)[:top_k]

    logger.info("Top %d by hybrid score", top_k)

    # Step 5: LLM reranker → {"slide_number": int}
    chosen_number = _llm_select_slide(normalised_query, top_k_results)

    best = (
        next((c for c in top_k_results
              if int(c.get("slide_number") or c.get("slide_id") or 0) == chosen_number),
             top_k_results[0])
        if chosen_number is not None else top_k_results[0]
    )

    recommended_slide_number = int(best.get("slide_number") or best.get("slide_id") or 1)
    recommended_slide_index  = max(recommended_slide_number - 1, 0)
    session["last_slide"]    = recommended_slide_number

    logger.info("Final selection → slide %d", recommended_slide_number)

    return {
        "answer": f"Jumping to slide {recommended_slide_number}.",
        "recommended_slide_number": recommended_slide_number,
        "recommended_slide_index": recommended_slide_index,
        "retrieval": db_results,
        "intent": "SEARCH",
    }
