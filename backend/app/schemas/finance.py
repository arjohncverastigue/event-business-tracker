from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class FinanceBase(BaseModel):
    entry_type: Literal["income", "expense"]
    description: str
    category: str
    amount: float = Field(gt=0)
    entry_date: datetime


class FinanceCreate(FinanceBase):
    pass


class FinanceRead(FinanceBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
