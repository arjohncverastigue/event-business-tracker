from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Quotation, User
from app.schemas.quotation import (
    QuotationAIRequest,
    QuotationAIResponse,
    QuotationCreate,
    QuotationEmailRequest,
    QuotationItemRead,
    QuotationRead,
    QuotationUpdate,
)
from app.services.ai_service import generate_quote_outline
from app.services.email_service import send_quotation_email
from app.services.pdf_service import build_quotation_pdf
from app.utils.auth import get_current_user

router = APIRouter(prefix="/quotations", tags=["quotations"])


def _get_quotation_or_404(db: Session, quotation_id: int, user_id: int) -> Quotation:
    quotation = (
        db.query(Quotation)
        .filter(Quotation.id == quotation_id, Quotation.user_id == user_id)
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation


def _as_schema(quotation: Quotation) -> QuotationRead:
    return QuotationRead.model_validate(quotation)


@router.get("/", response_model=List[QuotationRead])
def list_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotations = (
        db.query(Quotation)
        .filter(Quotation.user_id == current_user.id)
        .order_by(Quotation.created_at.desc())
        .all()
    )
    return [_as_schema(q) for q in quotations]


@router.post("/", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
def create_quotation(
    payload: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = Quotation(
        user_id=current_user.id,
        client=payload.client,
        event_type=payload.event_type,
        event_date=payload.event_date,
        status=payload.status,
        items=[item.model_dump() for item in payload.items],
    )
    db.add(quotation)
    db.commit()
    db.refresh(quotation)
    return _as_schema(quotation)


@router.put("/{quotation_id}", response_model=QuotationRead)
def update_quotation(
    quotation_id: int,
    payload: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = _get_quotation_or_404(db, quotation_id, current_user.id)
    update_data = payload.model_dump(exclude_unset=True)
    if "items" in update_data and update_data["items"] is not None:
        update_data["items"] = [item.model_dump() for item in update_data["items"]]
    for field, value in update_data.items():
        setattr(quotation, field, value)
    db.add(quotation)
    db.commit()
    db.refresh(quotation)
    return _as_schema(quotation)


@router.delete("/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = _get_quotation_or_404(db, quotation_id, current_user.id)
    db.delete(quotation)
    db.commit()
    return None


@router.post("/generate-ai", response_model=QuotationAIResponse)
def generate_ai_quote(payload: QuotationAIRequest):
    raw_items = generate_quote_outline(payload.brief)
    parsed_items = [QuotationItemRead(**item) for item in raw_items]
    return QuotationAIResponse(items=parsed_items)


@router.post("/{quotation_id}/send-email")
async def send_quotation_email_endpoint(
    quotation_id: int,
    payload: QuotationEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = _get_quotation_or_404(db, quotation_id, current_user.id)
    pdf_bytes = build_quotation_pdf(quotation)
    subject = f"Quotation for {quotation.client}"
    body = payload.message or "Please find the attached quotation."
    await send_quotation_email(
        recipient=payload.recipient,
        subject=subject,
        body=body,
        attachment=(f"quotation-{quotation.id}.pdf", pdf_bytes),
    )
    return {"status": "sent"}
