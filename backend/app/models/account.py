import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # 'bank', 'cash', 'credit_card', 'wallet', 'other'
    opening_balance = Column(Numeric(12, 2), default=0.00, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    description = Column(String(255), nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", foreign_keys="[Transaction.account_id]", back_populates="account", cascade="all, delete-orphan")
    transfers_received = relationship("Transaction", foreign_keys="[Transaction.destination_account_id]", back_populates="destination_account")
