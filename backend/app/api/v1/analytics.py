from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsResponse)
def get_dashboard_analytics(
    month: Optional[str] = Query(default=None, description="Format YYYY-MM, defaults to current month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsService.get_dashboard_data(db, current_user.id, month)
