from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetOut])
def get_budgets(
    month: Optional[str] = Query(default=None, description="Month in format YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return BudgetService.get_budgets(db, current_user.id, month)

@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return BudgetService.create_budget(db, current_user.id, budget_in)

@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: str,
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return BudgetService.update_budget(db, current_user.id, budget_id, budget_in)

@router.delete("/{budget_id}", status_code=status.HTTP_200_OK)
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    BudgetService.delete_budget(db, current_user.id, budget_id)
    return {"message": "Budget deleted successfully."}
