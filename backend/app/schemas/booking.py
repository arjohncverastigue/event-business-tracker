from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BookingBase(BaseModel):
    client: str
    event_type: str
    event_date: datetime
    venue: str
    amount: float = Field(gt=0)
    status: str = Field(default="pending")
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    client: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[datetime] = None
    venue: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    status: Optional[str] = None
    notes: Optional[str] = None


class BookingRead(BookingBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
