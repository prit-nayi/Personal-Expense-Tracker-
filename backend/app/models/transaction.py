import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String(20), nullable=False)  # 'expense', 'income', 'transfer'
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    occurred_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    description = Column(String(255), nullable=False)
    notes = Column(String(500), nullable=True)
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="transactions")
    account = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    destination_account = relationship("Account", foreign_keys=[destination_account_id], back_populates="transfers_received")
    category = relationship("Category", back_populates="transactions")

    __table_args__ = (
        Index("ix_transactions_user_occurred", "user_id", "occurred_at"),
    )
