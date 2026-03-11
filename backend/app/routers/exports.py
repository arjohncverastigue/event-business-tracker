from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Finance, Quotation, User
from app.services.pdf_service import build_finance_report_pdf, build_quotation_pdf
from app.services.excel_service import build_finance_excel
from app.utils.auth import get_current_user

router = APIRouter(prefix="/exports", tags=["exports"])


def _get_quotation(db: Session, quotation_id: int, user_id: int) -> Quotation:
    quotation = (
        db.query(Quotation)
        .filter(Quotation.id == quotation_id, Quotation.user_id == user_id)
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation


def _finance_queryset(db: Session, user_id: int) -> list[Finance]:
    return (
        db.query(Finance)
        .filter(Finance.user_id == user_id)
        .order_by(Finance.entry_date.desc())
        .all()
    )


@router.get("/pdf/quotations/{quotation_id}")
def export_quotation_pdf(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = _get_quotation(db, quotation_id, current_user.id)
    pdf_bytes = build_quotation_pdf(quotation)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=quotation-{quotation.id}.pdf",
        },
    )


@router.get("/pdf/finances")
def export_finances_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finances = _finance_queryset(db, current_user.id)
    pdf_bytes = build_finance_report_pdf(finances)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=finances.pdf",
        },
    )


@router.get("/excel/finances")
def export_finances_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finances = _finance_queryset(db, current_user.id)
    excel_bytes = build_finance_excel(finances)
    return StreamingResponse(
        iter([excel_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=finances.xlsx",
        },
    )
