import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction

router = APIRouter(prefix="/exports", tags=["Exports"])

def sanitize_csv_cell(val: Optional[str]) -> str:
    if not val:
        return ""
    s = str(val)
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + s
    return s

@router.get("/transactions/csv")
def export_transactions_csv(
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    account_id: Optional[str] = Query(default=None),
    category_id: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).options(
        joinedload(Transaction.account),
        joinedload(Transaction.destination_account),
        joinedload(Transaction.category)
    ).filter(Transaction.user_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.occurred_at >= start_date)
    if end_date:
        query = query.filter(Transaction.occurred_at <= end_date)
    if account_id:
        query = query.filter(or_(Transaction.account_id == account_id, Transaction.destination_account_id == account_id))
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if type:
        query = query.filter(Transaction.type == type)

    transactions = query.order_by(desc(Transaction.occurred_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID",
        "Date",
        "Type",
        "Amount",
        "Currency",
        "Account",
        "Destination Account",
        "Category",
        "Description",
        "Notes",
        "Tags"
    ])

    for tx in transactions:
        writer.writerow([
            tx.id,
            tx.occurred_at.strftime("%Y-%m-%d %H:%M:%S") if tx.occurred_at else "",
            tx.type,
            str(tx.amount),
            tx.currency,
            sanitize_csv_cell(tx.account.name if tx.account else ""),
            sanitize_csv_cell(tx.destination_account.name if tx.destination_account else ""),
            sanitize_csv_cell(tx.category.name if tx.category else ""),
            sanitize_csv_cell(tx.description or ""),
            sanitize_csv_cell(tx.notes or ""),
            sanitize_csv_cell(tx.tags or "")
        ])

    csv_content = output.getvalue()
    filename = f"transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
