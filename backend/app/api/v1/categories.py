from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryOut])
def get_categories(
    type: Optional[str] = Query(default=None, description="'expense' or 'income'"),
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CategoryService.get_categories(db, current_user.id, type, include_archived)

@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CategoryService.create_custom_category(db, current_user.id, category_in)

@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: str,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CategoryService.update_category(db, current_user.id, category_id, category_in)

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_or_archive_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    CategoryService.delete_or_archive_category(db, current_user.id, category_id)
    return {"message": "Category processed successfully."}
