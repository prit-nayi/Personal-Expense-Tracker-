from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import calendar
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut

class BudgetService:
    @staticmethod
    def _get_month_date_range(month_str: str) -> (datetime, datetime):
        year, month = map(int, month_str.split("-"))
        _, last_day = calendar.monthrange(year, month)
        start_date = datetime(year, month, 1, 0, 0, 0)
        end_date = datetime(year, month, last_day, 23, 59, 59, 999999)
        return start_date, end_date

    @staticmethod
    def _enrich_budget_out(db: Session, budget: Budget) -> BudgetOut:
        start_date, end_date = BudgetService._get_month_date_range(budget.month)

        spent = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == budget.user_id,
            Transaction.category_id == budget.category_id,
            Transaction.type == "expense",
            Transaction.occurred_at >= start_date,
            Transaction.occurred_at <= end_date
        ).scalar()

        spent_amount = Decimal(str(spent)).quantize(Decimal("0.01"))
        budget_amount = Decimal(str(budget.amount)).quantize(Decimal("0.01"))
        remaining_amount = (budget_amount - spent_amount).quantize(Decimal("0.01"))

        utilization = float((spent_amount / budget_amount) * Decimal("100")) if budget_amount > 0 else 0.0
        utilization = round(utilization, 1)

        if utilization >= 100.0:
            status_val = "danger"
        elif utilization >= 80.0:
            status_val = "warning"
        else:
            status_val = "normal"

        out = BudgetOut.model_validate(budget)
        out.spent_amount = spent_amount
        out.remaining_amount = remaining_amount
        out.utilization_percentage = utilization
        out.status = status_val
        out.category_name = budget.category.name if budget.category else None
        out.category_icon = budget.category.icon if budget.category else None
        out.category_color = budget.category.color if budget.category else None
        return out

    @staticmethod
    def get_budgets(db: Session, user_id: str, month: Optional[str] = None) -> List[BudgetOut]:
        if not month:
            now = datetime.now()
            month = f"{now.year:04d}-{now.month:02d}"

        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == month
        ).all()

        return [BudgetService._enrich_budget_out(db, b) for b in budgets]

    @staticmethod
    def create_budget(db: Session, user_id: str, budget_in: BudgetCreate) -> BudgetOut:
        # Validate category
        cat = db.query(Category).filter(Category.id == budget_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
        if cat.type != "expense":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Budgets can only be set on expense categories.")

        # Check existing
        existing = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category_id == budget_in.category_id,
            Budget.month == budget_in.month
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Budget for this category in month {budget_in.month} already exists. You can update it instead."
            )

        budget = Budget(
            user_id=user_id,
            category_id=budget_in.category_id,
            amount=budget_in.amount,
            currency=budget_in.currency.upper(),
            month=budget_in.month
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return BudgetService._enrich_budget_out(db, budget)

    @staticmethod
    def update_budget(db: Session, user_id: str, budget_id: str, budget_in: BudgetUpdate) -> BudgetOut:
        budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
        if not budget:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

        if budget_in.amount is not None:
            budget.amount = budget_in.amount

        db.commit()
        db.refresh(budget)
        return BudgetService._enrich_budget_out(db, budget)

    @staticmethod
    def delete_budget(db: Session, user_id: str, budget_id: str) -> None:
        budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
        if not budget:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")
        db.delete(budget)
        db.commit()
