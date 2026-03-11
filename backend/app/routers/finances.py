from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Finance, User
from app.schemas.finance import FinanceCreate, FinanceRead
from app.utils.auth import get_current_user

router = APIRouter(prefix="/finances", tags=["finances"])


def _get_finance_or_404(db: Session, finance_id: int, user_id: int) -> Finance:
    finance = (
        db.query(Finance)
        .filter(Finance.id == finance_id, Finance.user_id == user_id)
        .first()
    )
    if not finance:
        raise HTTPException(status_code=404, detail="Finance entry not found")
    return finance


@router.get("/", response_model=list[FinanceRead])
def list_finances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Finance)
        .filter(Finance.user_id == current_user.id)
        .order_by(Finance.entry_date.desc())
        .all()
    )


@router.post("/", response_model=FinanceRead, status_code=status.HTTP_201_CREATED)
def create_finance(
    payload: FinanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finance = Finance(user_id=current_user.id, **payload.model_dump())
    db.add(finance)
    db.commit()
    db.refresh(finance)
    return finance


@router.delete("/{finance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_finance(
    finance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finance = _get_finance_or_404(db, finance_id, current_user.id)
    db.delete(finance)
    db.commit()
    return None
