import json
import os
from typing import Any, Dict, List

from fastapi import HTTPException

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover
    genai = None  # type: ignore

SYSTEM_PROMPT = (
    "You are an expert event quotation assistant. Respond ONLY with valid JSON matching this schema: "
    '{"items": [{"description": "string", "quantity": 1, "unit_price": 1200.00}]}. '
    "Use 2-4 line items with realistic unit prices in USD."
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if genai and GEMINI_API_KEY:
    try:  # pragma: no cover - configuration failure falls back gracefully
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel(model_name=GEMINI_MODEL, system_instruction=SYSTEM_PROMPT)
    except Exception:
        _model = None
else:
    _model = None

def _normalize_item(raw: Dict[str, Any]) -> Dict[str, Any] | None:
    description = str(raw.get("description", "")).strip()
    if not description:
        return None
    quantity = raw.get("quantity", 1)
    unit_price = raw.get("unit_price", 0)
    try:
        quantity = max(1, int(quantity))
        unit_price = float(unit_price)
    except (TypeError, ValueError):
        return None
    return {"description": description, "quantity": quantity, "unit_price": max(0.0, unit_price)}


def _fallback_items(brief: str) -> List[Dict[str, Any]]:
    base = brief.strip() or "event"
    suggestions = [
        {"description": f"Concept planning for {base}", "quantity": 1, "unit_price": 1200.0},
        {"description": "Venue coordination", "quantity": 1, "unit_price": 850.0},
        {"description": "Production crew", "quantity": 1, "unit_price": 1600.0},
    ]
    normalized = [_normalize_item(item) for item in suggestions]
    return [item for item in normalized if item]


def generate_quote_outline(brief: str) -> List[Dict[str, Any]]:
    if not brief or not brief.strip():
        raise HTTPException(status_code=400, detail="Please provide an event brief.")
    if not _model:
        return _fallback_items(brief)

    generation_prompt = (
        "Generate an itemized quotation for the following event brief. "
        "Return strictly valid JSON with an `items` array. Do not add commentary.\n\n"
        f"Brief: {brief.strip()}"
    )

    try:
        response = _model.generate_content(
            generation_prompt,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 900,
            },
        )
    except Exception:
        return _fallback_items(brief)

    raw_text = getattr(response, "text", "").strip()
    if not raw_text:
        try:
            raw_text = (
                response.candidates[0].content.parts[0].text.strip()  # type: ignore[attr-defined]
            )
        except Exception:
            raw_text = ""

    if raw_text.startswith("```"):
        fence_lines = raw_text.splitlines()
        raw_text = "\n".join(fence_lines[1:-1]).strip() if len(fence_lines) >= 3 else ""

    try:
        parsed = json.loads(raw_text)
        raw_items = parsed.get("items", parsed)
    except Exception:
        return _fallback_items(brief)

    normalized: List[Dict[str, Any]] = []
    for item in raw_items:
        normalized_item = _normalize_item(item)
        if normalized_item:
            normalized.append(normalized_item)

    return normalized or _fallback_items(brief)
