from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List
import calendar
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
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

        user = db.query(User).filter(User.id == user_id).first()
        user_currency = user.currency_code if user and user.currency_code else "USD"

        # 1. Total balance across active accounts in user.currency_code
        accounts = db.query(Account).filter(Account.user_id == user_id, Account.is_archived == False).all()
        matching_accounts = [acc for acc in accounts if acc.currency == user_currency]
        account_ids = [acc.id for acc in matching_accounts]
        balances = AccountService.get_balances(db, user_id, account_ids)
        total_balance = sum(balances.values(), Decimal("0.00"))

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
            currency=user_currency,
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
        category_ids = [cat_id for cat_id, _, _ in cat_query if cat_id]
        cats = {c.id: c for c in db.query(Category).filter(Category.id.in_(category_ids)).all()} if category_ids else {}
        for cat_id, cat_total, tx_count in cat_query:
            amount_dec = Decimal(str(cat_total)).quantize(Decimal("0.01"))
            pct = float((amount_dec / period_expenses) * Decimal("100")) if period_expenses > 0 else 0.0
            cat = cats.get(cat_id) if cat_id else None
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
        trend_months = []
        for i in range(5, -1, -1):
            m = target_month - i
            y = target_year
            while m <= 0:
                m += 12
                y -= 1
            trend_months.append((y, m, f"{y:04d}-{m:02d}"))

        first_y, first_m, _ = trend_months[0]
        range_start = datetime(first_y, first_m, 1, 0, 0, 0)
        range_end = end_of_month

        trend_query = db.query(
            func.extract("year", Transaction.occurred_at).label("y"),
            func.extract("month", Transaction.occurred_at).label("m"),
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), 0).label("total")
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type.in_(["income", "expense"]),
            Transaction.occurred_at >= range_start,
            Transaction.occurred_at <= range_end
        ).group_by(
            func.extract("year", Transaction.occurred_at),
            func.extract("month", Transaction.occurred_at),
            Transaction.type
        ).all()

        trend_data = {}
        for y, m, tx_type, total in trend_query:
            trend_data[(int(y), int(m), tx_type)] = Decimal(str(total)).quantize(Decimal("0.01"))

        monthly_trends: List[MonthlyTrendItem] = []
        for y, m, m_str in trend_months:
            m_inc_dec = trend_data.get((y, m, "income"), Decimal("0.00"))
            m_exp_dec = trend_data.get((y, m, "expense"), Decimal("0.00"))
            monthly_trends.append(MonthlyTrendItem(
                month=m_str,
                income=m_inc_dec,
                expenses=m_exp_dec,
                net=(m_inc_dec - m_exp_dec).quantize(Decimal("0.01"))
            ))

        # 7. Recent Transactions (last 8)
        recent_txs = db.query(Transaction).options(
            joinedload(Transaction.account),
            joinedload(Transaction.destination_account),
            joinedload(Transaction.category)
        ).filter(
            Transaction.user_id == user_id
        ).order_by(Transaction.occurred_at.desc(), Transaction.id.desc()).limit(8).all()

        recent_formatted = [TransactionService._format_transaction_out(t) for t in recent_txs]

        return AnalyticsResponse(
            summary=summary,
            category_spending=category_spending,
            monthly_trends=monthly_trends,
            recent_transactions=recent_formatted
        )
