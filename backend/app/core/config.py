from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Personal Expense Tracker"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "expense_tracker_secret_key_change_in_production_987654321_jwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for development convenience

    # Database: Default to SQLite for easy local setup, can be set to postgresql://... for Supabase/Neon/Postgres
    DATABASE_URL: str = "sqlite:///./expense_tracker.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
