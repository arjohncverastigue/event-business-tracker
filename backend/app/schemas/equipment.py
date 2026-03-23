from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EquipmentBase(BaseModel):
    name: str
    category: str
    quantity: int = Field(default=1, ge=0)
    condition: str = Field(default="good")
    availability_status: str = Field(default="available")
    notes: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=0)
    condition: Optional[str] = None
    availability_status: Optional[str] = None
    notes: Optional[str] = None


class EquipmentRead(EquipmentBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DamageReportBase(BaseModel):
    equipment_id: int
    client: str
    description: str
    date_reported: datetime
    repair_cost: float = Field(default=0, ge=0)
    status: str = Field(default="pending_repair")


class DamageReportCreate(DamageReportBase):
    pass


class DamageReportUpdate(BaseModel):
    equipment_id: Optional[int] = None
    client: Optional[str] = None
    description: Optional[str] = None
    date_reported: Optional[datetime] = None
    repair_cost: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = None


class DamageReportRead(DamageReportBase):
    id: int
    user_id: int
    created_at: datetime
    equipment_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
