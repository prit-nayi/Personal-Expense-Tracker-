from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.transaction import TransactionOut

class DashboardSummary(BaseModel):
    total_balance: Decimal
    period_income: Decimal
    period_expenses: Decimal
    period_net_savings: Decimal
    savings_rate_percentage: float
    currency: str
    active_accounts_count: int
    transactions_count: int

class CategorySpendingItem(BaseModel):
    category_id: Optional[str] = None
    category_name: str
    color: str
    icon: str
    amount: Decimal
    percentage: float
    transaction_count: int

class MonthlyTrendItem(BaseModel):
    month: str  # YYYY-MM
    income: Decimal
    expenses: Decimal
    net: Decimal

class AnalyticsResponse(BaseModel):
    summary: DashboardSummary
    category_spending: List[CategorySpendingItem]
    monthly_trends: List[MonthlyTrendItem]
    recent_transactions: List[TransactionOut]
