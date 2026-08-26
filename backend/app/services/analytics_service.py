from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List
import calendar
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.services.account_service import AccountService
from app.services.transaction_service import TransactionService
from app.schemas.analytics import (
    DashboardSummary, CategorySpendingItem, MonthlyTrendItem, AnalyticsResponse
)

class AnalyticsService:
    @staticmethod
    def get_dashboard_data(db: Session, user_id: str, month: Optional[str] = None) -> AnalyticsResponse:
        now = datetime.now()
        if not month:
            target_year = now.year
            target_month = now.month
            month_str = f"{target_year:04d}-{target_month:02d}"
        else:
            target_year, target_month = map(int, month.split("-"))
            month_str = month

        _, last_day = calendar.monthrange(target_year, target_month)
        start_of_month = datetime(target_year, target_month, 1, 0, 0, 0)
        end_of_month = datetime(target_year, target_month, last_day, 23, 59, 59, 999999)

        # 1. Total balance across all active accounts
        accounts = db.query(Account).filter(Account.user_id == user_id, Account.is_archived == False).all()
        total_balance = sum(
            (AccountService.calculate_account_balance(db, acc) for acc in accounts),
            Decimal("0.00")
        )

        # 2. Period Income
        income_sum = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == user_id,
            Transaction.type == "income",
            Transaction.occurred_at >= start_of_month,
            Transaction.occurred_at <= end_of_month
        ).scalar()
        period_income = Decimal(str(income_sum)).quantize(Decimal("0.01"))

        # 3. Period Expense
        expense_sum = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.occurred_at >= start_of_month,
            Transaction.occurred_at <= end_of_month
        ).scalar()
        period_expenses = Decimal(str(expense_sum)).quantize(Decimal("0.01"))

        # 4. Net Savings & Savings Rate
        period_net_savings = (period_income - period_expenses).quantize(Decimal("0.01"))
        savings_rate = float((period_net_savings / period_income) * Decimal("100")) if period_income > 0 else 0.0
        savings_rate = round(savings_rate, 1)

        total_tx_count = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.occurred_at >= start_of_month,
            Transaction.occurred_at <= end_of_month
        ).count()

        summary = DashboardSummary(
            total_balance=total_balance,
            period_income=period_income,
            period_expenses=period_expenses,
            period_net_savings=period_net_savings,
            savings_rate_percentage=savings_rate,
            currency=accounts[0].currency if accounts else "USD",
            active_accounts_count=len(accounts),
            transactions_count=total_tx_count
        )

        # 5. Category Spending Items
        cat_query = db.query(
            Transaction.category_id,
            func.sum(Transaction.amount).label("cat_total"),
            func.count(Transaction.id).label("tx_count")
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.occurred_at >= start_of_month,
            Transaction.occurred_at <= end_of_month
        ).group_by(Transaction.category_id).all()

        category_spending: List[CategorySpendingItem] = []
        for cat_id, cat_total, tx_count in cat_query:
            amount_dec = Decimal(str(cat_total)).quantize(Decimal("0.01"))
            pct = float((amount_dec / period_expenses) * Decimal("100")) if period_expenses > 0 else 0.0
            cat = db.query(Category).filter(Category.id == cat_id).first() if cat_id else None
            category_spending.append(CategorySpendingItem(
                category_id=cat_id,
                category_name=cat.name if cat else "Uncategorized",
                color=cat.color if cat and cat.color else "#6B7280",
                icon=cat.icon if cat and cat.icon else "Tag",
                amount=amount_dec,
                percentage=round(pct, 1),
                transaction_count=tx_count
            ))
        category_spending.sort(key=lambda x: x.amount, reverse=True)

        # 6. Monthly Trends (Past 6 Months)
        monthly_trends: List[MonthlyTrendItem] = []
        for i in range(5, -1, -1):
            # Calculate year and month for (target_month - i)
            m = target_month - i
            y = target_year
            while m <= 0:
                m += 12
                y -= 1
            m_str = f"{y:04d}-{m:02d}"
            _, m_last_day = calendar.monthrange(y, m)
            m_start = datetime(y, m, 1, 0, 0, 0)
            m_end = datetime(y, m, m_last_day, 23, 59, 59, 999999)

            m_inc = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
                Transaction.user_id == user_id,
                Transaction.type == "income",
                Transaction.occurred_at >= m_start,
                Transaction.occurred_at <= m_end
            ).scalar()

            m_exp = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.occurred_at >= m_start,
                Transaction.occurred_at <= m_end
            ).scalar()

            m_inc_dec = Decimal(str(m_inc)).quantize(Decimal("0.01"))
            m_exp_dec = Decimal(str(m_exp)).quantize(Decimal("0.01"))

            monthly_trends.append(MonthlyTrendItem(
                month=m_str,
                income=m_inc_dec,
                expenses=m_exp_dec,
                net=(m_inc_dec - m_exp_dec).quantize(Decimal("0.01"))
            ))

        # 7. Recent Transactions (last 8)
        recent_txs = db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).order_by(Transaction.occurred_at.desc(), Transaction.id.desc()).limit(8).all()

        recent_formatted = [TransactionService._format_transaction_out(t) for t in recent_txs]

        return AnalyticsResponse(
            summary=summary,
            category_spending=category_spending,
            monthly_trends=monthly_trends,
            recent_transactions=recent_formatted
        )
