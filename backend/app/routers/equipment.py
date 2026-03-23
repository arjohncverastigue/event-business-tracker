from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Equipment, User
from app.schemas.equipment import EquipmentCreate, EquipmentRead, EquipmentUpdate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/equipment", tags=["equipment"])


def _get_equipment_or_404(db: Session, equipment_id: int, user_id: int) -> Equipment:
    equipment = (
        db.query(Equipment)
        .filter(Equipment.id == equipment_id, Equipment.user_id == user_id)
        .first()
    )
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.get("/", response_model=list[EquipmentRead])
def list_equipment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Equipment)
        .filter(Equipment.user_id == current_user.id)
        .order_by(Equipment.created_at.desc())
        .all()
    )


@router.post("/", response_model=EquipmentRead, status_code=status.HTTP_201_CREATED)
def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    equipment = Equipment(user_id=current_user.id, **payload.model_dump())
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentRead)
def update_equipment(
    equipment_id: int,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    equipment = _get_equipment_or_404(db, equipment_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(equipment, field, value)
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    equipment = _get_equipment_or_404(db, equipment_id, current_user.id)
    db.delete(equipment)
    db.commit()
    return None
