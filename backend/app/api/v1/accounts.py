from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut
from app.services.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("", response_model=List[AccountOut])
def get_accounts(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AccountService.get_accounts(db, current_user.id, include_archived)

@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AccountService.create_account(db, current_user.id, account_in)

@router.get("/{account_id}", response_model=AccountOut)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AccountService.get_account_out_by_id(db, current_user.id, account_id)

@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: str,
    account_in: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AccountService.update_account(db, current_user.id, account_id, account_in)

@router.delete("/{account_id}", status_code=status.HTTP_200_OK)
def delete_or_archive_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    AccountService.delete_or_archive_account(db, current_user.id, account_id)
    return {"message": "Account processed successfully."}
