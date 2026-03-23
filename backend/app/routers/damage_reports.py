from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import DamageReport, Equipment, User
from app.schemas.equipment import DamageReportCreate, DamageReportRead, DamageReportUpdate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/damage-reports", tags=["damage-reports"])


def _get_damage_report_or_404(db: Session, damage_report_id: int, user_id: int) -> DamageReport:
    damage_report = (
        db.query(DamageReport)
        .filter(DamageReport.id == damage_report_id, DamageReport.user_id == user_id)
        .first()
    )
    if not damage_report:
        raise HTTPException(status_code=404, detail="Damage report not found")
    return damage_report


@router.get("/", response_model=list[DamageReportRead])
def list_damage_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = (
        db.query(DamageReport)
        .filter(DamageReport.user_id == current_user.id)
        .order_by(DamageReport.date_reported.desc())
        .all()
    )
    for report in reports:
        equipment = db.query(Equipment).filter(Equipment.id == report.equipment_id).first()
        if equipment:
            report.equipment_name = equipment.name
    return reports


@router.post("/", response_model=DamageReportRead, status_code=status.HTTP_201_CREATED)
def create_damage_report(
    payload: DamageReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    equipment = (
        db.query(Equipment)
        .filter(Equipment.id == payload.equipment_id, Equipment.user_id == current_user.id)
        .first()
    )
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    damage_report = DamageReport(user_id=current_user.id, **payload.model_dump())
    db.add(damage_report)
    db.commit()
    db.refresh(damage_report)
    damage_report.equipment_name = equipment.name
    return damage_report


@router.put("/{damage_report_id}", response_model=DamageReportRead)
def update_damage_report(
    damage_report_id: int,
    payload: DamageReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    damage_report = _get_damage_report_or_404(db, damage_report_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(damage_report, field, value)
    db.add(damage_report)
    db.commit()
    db.refresh(damage_report)
    
    equipment = db.query(Equipment).filter(Equipment.id == damage_report.equipment_id).first()
    if equipment:
        damage_report.equipment_name = equipment.name
    return damage_report


@router.delete("/{damage_report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_damage_report(
    damage_report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    damage_report = _get_damage_report_or_404(db, damage_report_id, current_user.id)
    db.delete(damage_report)
    db.commit()
    return None
