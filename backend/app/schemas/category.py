from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

CategoryType = Literal["expense", "income"]

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: CategoryType
    icon: Optional[str] = Field(default="Tag", max_length=50)
    color: Optional[str] = Field(default="#6B7280", max_length=20)

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icon: Optional[str] = None
    color: Optional[str] = None
    is_archived: Optional[bool] = None

class CategoryOut(CategoryBase):
    id: str
    user_id: Optional[str] = None
    is_archived: bool
    is_system: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
