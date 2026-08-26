import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    # user_id is null for system-defined default categories, non-null for user-custom categories
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # 'expense' or 'income'
    icon = Column(String(50), nullable=True)   # Icon identifier for UI (e.g. 'Utensils', 'Car', etc.)
    color = Column(String(20), nullable=True)  # Hex or color token (e.g. '#EF4444')
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")
