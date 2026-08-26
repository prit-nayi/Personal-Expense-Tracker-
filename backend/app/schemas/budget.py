from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class BudgetBase(BaseModel):
    category_id: str
    amount: Decimal = Field(..., gt=Decimal("0.00"), le=Decimal("999999999.99"))
    currency: str = Field(default="USD", max_length=10)
    month: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Format YYYY-MM, e.g., 2026-08")

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount: Optional[Decimal] = Field(default=None, gt=Decimal("0.00"), le=Decimal("999999999.99"))

class BudgetOut(BudgetBase):
    id: str
    user_id: str
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    spent_amount: Decimal = Decimal("0.00")
    remaining_amount: Decimal = Decimal("0.00")
    utilization_percentage: float = 0.0
    status: str = "normal"  # "normal", "warning" (>=80%), "danger" (>=100%)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
