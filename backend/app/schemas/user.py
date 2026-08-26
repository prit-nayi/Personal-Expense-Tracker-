from datetime import datetime
from typing import Optional
import re
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class UserBase(BaseModel):
    email: str = Field(..., description="User email address")
    full_name: Optional[str] = None
    currency_code: str = Field(default="USD", max_length=10)

    @field_validator("email", mode="before")
    @classmethod
    def validate_and_clean_email(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Email must be a string.")
        cleaned = v.strip().lower()
        if not cleaned:
            raise ValueError("Email cannot be empty.")
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Please provide a valid email address (e.g. user@example.com).")
        return cleaned

    @field_validator("currency_code", mode="before")
    @classmethod
    def clean_currency(cls, v: Optional[str]) -> str:
        if not v:
            return "USD"
        return v.strip().upper()

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class UserLogin(BaseModel):
    email: str = Field(..., min_length=1, description="Email address")
    password: str = Field(..., min_length=1, description="Password")

    @field_validator("email", mode="before")
    @classmethod
    def clean_login_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    currency_code: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    currency_code: str = "USD"
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
