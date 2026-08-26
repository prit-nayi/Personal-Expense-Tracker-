from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal
from pydantic import BaseModel, Field

AccountType = Literal["bank", "cash", "credit_card", "wallet", "other"]

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: AccountType
    opening_balance: Decimal = Field(default=Decimal("0.00"), ge=Decimal("-999999999.99"), le=Decimal("999999999.99"))
    currency: str = Field(default="USD", max_length=10)
    description: Optional[str] = Field(default=None, max_length=255)

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[AccountType] = None
    currency: Optional[str] = Field(default=None, max_length=10)
    description: Optional[str] = Field(default=None, max_length=255)
    is_archived: Optional[bool] = None

class AccountOut(AccountBase):
    id: str
    user_id: str
    is_archived: bool
    current_balance: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
