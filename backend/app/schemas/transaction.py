from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, model_validator
from app.schemas.account import AccountOut
from app.schemas.category import CategoryOut

TransactionType = Literal["expense", "income", "transfer"]

class TransactionBase(BaseModel):
    account_id: str
    destination_account_id: Optional[str] = None
    category_id: Optional[str] = None
    type: TransactionType
    amount: Decimal = Field(..., gt=Decimal("0.00"), le=Decimal("999999999.99"))
    currency: str = Field(default="USD", max_length=10)
    occurred_at: datetime
    description: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[str] = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate_transaction_fields(self):
        if self.type == "transfer":
            if not self.destination_account_id:
                raise ValueError("Transfers require a destination account.")
            if self.account_id == self.destination_account_id:
                raise ValueError("Source and destination accounts must be different for a transfer.")
        elif self.type in ["expense", "income"]:
            if not self.category_id:
                raise ValueError(f"Category is required for {self.type} transactions.")
        return self

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    category_id: Optional[str] = None
    type: Optional[TransactionType] = None
    amount: Optional[Decimal] = Field(default=None, gt=Decimal("0.00"), le=Decimal("999999999.99"))
    currency: Optional[str] = Field(default=None, max_length=10)
    occurred_at: Optional[datetime] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[str] = Field(default=None, max_length=255)

class TransactionOut(TransactionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    account_name: Optional[str] = None
    destination_account_name: Optional[str] = None
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedTransactions(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    limit: int
    total_pages: int
