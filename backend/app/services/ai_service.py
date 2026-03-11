import json
import os
from typing import Any, Dict, List

from fastapi import HTTPException

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover
    Anthropic = None  # type: ignore

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620")

_client = Anthropic(api_key=ANTHROPIC_API_KEY) if (Anthropic and ANTHROPIC_API_KEY) else None

SYSTEM_PROMPT = (
    "You are an expert event quotation assistant. Respond ONLY with valid JSON matching this schema: "
    '{"items": [{"description": "string", "quantity": 1, "unit_price": 1200.00}]}. '
    "Use 2-4 line items with realistic unit prices in USD."
)


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
    if not _client:
        return _fallback_items(brief)

    try:
        response = _client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=600,
            temperature=0.3,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Generate an itemized quotation for the following event brief. "
                        "Return strictly valid JSON with an `items` array. Do not add commentary.\n\n"
                        f"Brief: {brief.strip()}"
                    ),
                }
            ],
        )
    except Exception:
        return _fallback_items(brief)

    text_chunks = [
        block.text for block in getattr(response, "content", []) if getattr(block, "type", "") == "text"
    ]
    raw_text = "".join(text_chunks).strip()

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
