from decimal import Decimal
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from fastapi import HTTPException, status
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut

class AccountService:
    @staticmethod
    def get_balances(db: Session, user_id: str, account_ids: List[str]) -> Dict[str, Decimal]:
        if not account_ids:
            return {}
        accounts = db.query(Account.id, Account.opening_balance).filter(
            Account.id.in_(account_ids),
            Account.user_id == user_id
        ).all()
        balances = {acc_id: Decimal(str(ob or 0)) for acc_id, ob in accounts}

        primary_txs = db.query(
            Transaction.account_id,
            func.coalesce(func.sum(
                case(
                    (Transaction.type == "income", Transaction.amount),
                    (Transaction.type.in_(["expense", "transfer"]), -Transaction.amount),
                    else_=0
                )
            ), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.account_id.in_(account_ids)
        ).group_by(Transaction.account_id).all()

        for acc_id, net in primary_txs:
            if acc_id in balances:
                balances[acc_id] += Decimal(str(net))

        transfers_in = db.query(
            Transaction.destination_account_id,
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.destination_account_id.in_(account_ids),
            Transaction.type == "transfer"
        ).group_by(Transaction.destination_account_id).all()

        for acc_id, tin in transfers_in:
            if acc_id in balances:
                balances[acc_id] += Decimal(str(tin))

        return {k: v.quantize(Decimal("0.01")) for k, v in balances.items()}

    @staticmethod
    def calculate_account_balance(db: Session, account: Account) -> Decimal:
        balances = AccountService.get_balances(db, account.user_id, [account.id])
        return balances.get(account.id, Decimal(str(account.opening_balance)).quantize(Decimal("0.01")))

    @staticmethod
    def get_accounts(db: Session, user_id: str, include_archived: bool = False) -> List[AccountOut]:
        query = db.query(Account).filter(Account.user_id == user_id)
        if not include_archived:
            query = query.filter(Account.is_archived == False)
        accounts = query.order_by(Account.created_at.asc()).all()

        account_ids = [acc.id for acc in accounts]
        balances = AccountService.get_balances(db, user_id, account_ids)

        results = []
        for acc in accounts:
            acc_out = AccountOut.model_validate(acc)
            acc_out.current_balance = balances.get(acc.id, Decimal(str(acc.opening_balance)).quantize(Decimal("0.01")))
            results.append(acc_out)
        return results

    @staticmethod
    def get_account_by_id(db: Session, user_id: str, account_id: str) -> Account:
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found."
            )
        return account

    @staticmethod
    def get_account_out_by_id(db: Session, user_id: str, account_id: str) -> AccountOut:
        account = AccountService.get_account_by_id(db, user_id, account_id)
        current_balance = AccountService.calculate_account_balance(db, account)
        acc_out = AccountOut.model_validate(account)
        acc_out.current_balance = current_balance
        return acc_out

    @staticmethod
    def create_account(db: Session, user_id: str, account_in: AccountCreate) -> AccountOut:
        account = Account(
            user_id=user_id,
            name=account_in.name.strip(),
            type=account_in.type,
            opening_balance=account_in.opening_balance,
            currency=account_in.currency.upper(),
            description=account_in.description,
            is_archived=False
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        acc_out = AccountOut.model_validate(account)
        acc_out.current_balance = Decimal(str(account.opening_balance)).quantize(Decimal("0.01"))
        return acc_out

    @staticmethod
    def update_account(db: Session, user_id: str, account_id: str, account_in: AccountUpdate) -> AccountOut:
        account = AccountService.get_account_by_id(db, user_id, account_id)
        if account_in.name is not None:
            account.name = account_in.name.strip()
        if account_in.type is not None:
            account.type = account_in.type
        if account_in.currency is not None:
            account.currency = account_in.currency.upper()
        if account_in.description is not None:
            account.description = account_in.description
        if account_in.is_archived is not None:
            account.is_archived = account_in.is_archived

        db.commit()
        db.refresh(account)
        current_balance = AccountService.calculate_account_balance(db, account)
        acc_out = AccountOut.model_validate(account)
        acc_out.current_balance = current_balance
        return acc_out

    @staticmethod
    def delete_or_archive_account(db: Session, user_id: str, account_id: str) -> None:
        account = AccountService.get_account_by_id(db, user_id, account_id)
        # Check if transactions exist
        tx_count = db.query(Transaction).filter(
            (Transaction.account_id == account_id) | (Transaction.destination_account_id == account_id)
        ).count()
        if tx_count > 0:
            # Must archive rather than permanently delete to preserve historical reporting
            account.is_archived = True
            db.commit()
        else:
            db.delete(account)
            db.commit()
