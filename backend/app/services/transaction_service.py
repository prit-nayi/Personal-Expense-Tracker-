from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from fastapi import HTTPException, status
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut, PaginatedTransactions

class TransactionService:
    @staticmethod
    def _validate_references(
        db: Session,
        user_id: str,
        account_id: str,
        destination_account_id: Optional[str],
        category_id: Optional[str],
        tx_type: str
    ) -> None:
        # Validate source account
        source_account = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
        if not source_account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
        if source_account.is_archived:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot record transactions on an archived account.")

        if tx_type == "transfer":
            if not destination_account_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Destination account is required for transfers.")
            if account_id == destination_account_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source and destination accounts must be different.")
            dest_account = db.query(Account).filter(Account.id == destination_account_id, Account.user_id == user_id).first()
            if not dest_account:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination account not found.")
            if dest_account.is_archived:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot transfer to an archived account.")
        else:
            if not category_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category is required for income/expense.")
            category = db.query(Category).filter(
                Category.id == category_id,
                or_(Category.user_id == user_id, Category.user_id.is_(None))
            ).first()
            if not category:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
            if category.is_archived:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot use an archived category.")

    @staticmethod
    def _format_transaction_out(tx: Transaction) -> TransactionOut:
        out = TransactionOut.model_validate(tx)
        out.account_name = tx.account.name if tx.account else None
        out.destination_account_name = tx.destination_account.name if tx.destination_account else None
        out.category_name = tx.category.name if tx.category else None
        out.category_icon = tx.category.icon if tx.category else None
        out.category_color = tx.category.color if tx.category else None
        return out

    @staticmethod
    def create_transaction(db: Session, user_id: str, tx_in: TransactionCreate) -> TransactionOut:
        TransactionService._validate_references(
            db, user_id, tx_in.account_id, tx_in.destination_account_id, tx_in.category_id, tx_in.type
        )
        tx = Transaction(
            user_id=user_id,
            account_id=tx_in.account_id,
            destination_account_id=tx_in.destination_account_id if tx_in.type == "transfer" else None,
            category_id=tx_in.category_id if tx_in.type != "transfer" else None,
            type=tx_in.type,
            amount=tx_in.amount,
            currency=tx_in.currency.upper(),
            occurred_at=tx_in.occurred_at,
            description=tx_in.description.strip(),
            notes=tx_in.notes,
            tags=tx_in.tags
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return TransactionService._format_transaction_out(tx)

    @staticmethod
    def get_transaction_by_id(db: Session, user_id: str, transaction_id: str) -> Transaction:
        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id
        ).first()
        if not tx:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
        return tx

    @staticmethod
    def get_transaction_out_by_id(db: Session, user_id: str, transaction_id: str) -> TransactionOut:
        tx = TransactionService.get_transaction_by_id(db, user_id, transaction_id)
        return TransactionService._format_transaction_out(tx)

    @staticmethod
    def update_transaction(db: Session, user_id: str, transaction_id: str, tx_in: TransactionUpdate) -> TransactionOut:
        tx = TransactionService.get_transaction_by_id(db, user_id, transaction_id)

        target_account_id = tx_in.account_id if tx_in.account_id is not None else tx.account_id
        target_dest_id = tx_in.destination_account_id if tx_in.destination_account_id is not None else tx.destination_account_id
        target_cat_id = tx_in.category_id if tx_in.category_id is not None else tx.category_id
        target_type = tx_in.type if tx_in.type is not None else tx.type

        TransactionService._validate_references(
            db, user_id, target_account_id, target_dest_id, target_cat_id, target_type
        )

        if tx_in.account_id is not None:
            tx.account_id = tx_in.account_id
        if tx_in.type is not None:
            tx.type = tx_in.type
            if tx.type != "transfer":
                tx.destination_account_id = None
            else:
                tx.category_id = None
        if tx_in.destination_account_id is not None and tx.type == "transfer":
            tx.destination_account_id = tx_in.destination_account_id
        if tx_in.category_id is not None and tx.type != "transfer":
            tx.category_id = tx_in.category_id
        if tx_in.amount is not None:
            tx.amount = tx_in.amount
        if tx_in.currency is not None:
            tx.currency = tx_in.currency.upper()
        if tx_in.occurred_at is not None:
            tx.occurred_at = tx_in.occurred_at
        if tx_in.description is not None:
            tx.description = tx_in.description.strip()
        if tx_in.notes is not None:
            tx.notes = tx_in.notes
        if tx_in.tags is not None:
            tx.tags = tx_in.tags

        db.commit()
        db.refresh(tx)
        return TransactionService._format_transaction_out(tx)

    @staticmethod
    def delete_transaction(db: Session, user_id: str, transaction_id: str) -> None:
        tx = TransactionService.get_transaction_by_id(db, user_id, transaction_id)
        db.delete(tx)
        db.commit()

    @staticmethod
    def get_transactions_filtered(
        db: Session,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        account_id: Optional[str] = None,
        category_id: Optional[str] = None,
        tx_type: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
        sort_by: str = "occurred_at",
        sort_order: str = "desc"
    ) -> PaginatedTransactions:
        query = db.query(Transaction).filter(Transaction.user_id == user_id)

        if start_date:
            query = query.filter(Transaction.occurred_at >= start_date)
        if end_date:
            query = query.filter(Transaction.occurred_at <= end_date)
        if account_id:
            query = query.filter(
                or_(Transaction.account_id == account_id, Transaction.destination_account_id == account_id)
            )
        if category_id:
            query = query.filter(Transaction.category_id == category_id)
        if tx_type:
            query = query.filter(Transaction.type == tx_type)
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Transaction.description.ilike(search_pattern),
                    Transaction.notes.ilike(search_pattern),
                    Transaction.tags.ilike(search_pattern)
                )
            )

        total = query.count()
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        order_col = getattr(Transaction, sort_by, Transaction.occurred_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(order_col), asc(Transaction.id))
        else:
            query = query.order_by(desc(order_col), desc(Transaction.id))

        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()

        formatted_items = [TransactionService._format_transaction_out(tx) for tx in items]

        return PaginatedTransactions(
            items=formatted_items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
