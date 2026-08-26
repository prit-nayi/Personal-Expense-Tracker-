from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut, PaginatedTransactions
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=PaginatedTransactions)
def get_transactions(
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    account_id: Optional[str] = Query(default=None),
    category_id: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None, description="'expense', 'income', or 'transfer'"),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="occurred_at"),
    sort_order: str = Query(default="desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TransactionService.get_transactions_filtered(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        category_id=category_id,
        tx_type=type,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TransactionService.create_transaction(db, current_user.id, tx_in)

@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TransactionService.get_transaction_out_by_id(db, current_user.id, transaction_id)

@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: str,
    tx_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TransactionService.update_transaction(db, current_user.id, transaction_id, tx_in)

@router.delete("/{transaction_id}", status_code=status.HTTP_200_OK)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    TransactionService.delete_transaction(db, current_user.id, transaction_id)
    return {"message": "Transaction deleted successfully."}
