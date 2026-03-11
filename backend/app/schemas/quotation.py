from datetime import datetime
from typing import List, Sequence

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field


class QuotationItemBase(BaseModel):
    description: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)


class QuotationItemRead(QuotationItemBase):
    @computed_field(return_type=float)
    def line_total(self) -> float:
        return self.quantity * self.unit_price


class QuotationBase(BaseModel):
    client: str
    event_type: str
    event_date: datetime
    status: str = Field(default="draft")
    items: Sequence[QuotationItemBase]


class QuotationCreate(QuotationBase):
    pass


class QuotationUpdate(BaseModel):
    client: str | None = None
    event_type: str | None = None
    event_date: datetime | None = None
    status: str | None = None
    items: List[QuotationItemBase] | None = None


class QuotationRead(BaseModel):
    id: int
    client: str
    event_type: str
    event_date: datetime
    status: str
    items: Sequence[QuotationItemRead]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field(return_type=float)
    def total_amount(self) -> float:
        total = 0.0
        for item in self.items:
            total += float(item.quantity * item.unit_price)
        return total


class QuotationAIRequest(BaseModel):
    brief: str


class QuotationAIResponse(BaseModel):
    items: Sequence[QuotationItemRead]

    @computed_field(return_type=float)
    def suggested_total(self) -> float:
        total = 0.0
        for item in self.items:
            total += float(item.quantity * item.unit_price)
        return total


class QuotationEmailRequest(BaseModel):
    recipient: EmailStr
    message: str | None = None
