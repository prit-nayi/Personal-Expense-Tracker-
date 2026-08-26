from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut

class CategoryService:
    @staticmethod
    def get_categories(db: Session, user_id: str, type_filter: Optional[str] = None, include_archived: bool = False) -> List[CategoryOut]:
        query = db.query(Category).filter(
            or_(Category.user_id == user_id, Category.user_id.is_(None))
        )
        if type_filter:
            query = query.filter(Category.type == type_filter)
        if not include_archived:
            query = query.filter(Category.is_archived == False)

        categories = query.order_by(Category.name.asc()).all()
        results = []
        for cat in categories:
            cat_out = CategoryOut.model_validate(cat)
            cat_out.is_system = (cat.user_id is None)
            results.append(cat_out)
        return results

    @staticmethod
    def get_category_by_id(db: Session, user_id: str, category_id: str) -> Category:
        category = db.query(Category).filter(
            Category.id == category_id,
            or_(Category.user_id == user_id, Category.user_id.is_(None))
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found."
            )
        return category

    @staticmethod
    def create_custom_category(db: Session, user_id: str, category_in: CategoryCreate) -> CategoryOut:
        # Check duplicate per user
        duplicate = db.query(Category).filter(
            or_(Category.user_id == user_id, Category.user_id.is_(None)),
            Category.name.ilike(category_in.name.strip()),
            Category.type == category_in.type
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A category named '{category_in.name}' for type '{category_in.type}' already exists."
            )

        category = Category(
            user_id=user_id,
            name=category_in.name.strip(),
            type=category_in.type,
            icon=category_in.icon or "Tag",
            color=category_in.color or "#6B7280",
            is_archived=False
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        cat_out = CategoryOut.model_validate(category)
        cat_out.is_system = False
        return cat_out

    @staticmethod
    def update_category(db: Session, user_id: str, category_id: str, category_in: CategoryUpdate) -> CategoryOut:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
        if category.user_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System categories cannot be modified.")
        if category.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this category.")

        if category_in.name is not None:
            category.name = category_in.name.strip()
        if category_in.icon is not None:
            category.icon = category_in.icon
        if category_in.color is not None:
            category.color = category_in.color
        if category_in.is_archived is not None:
            category.is_archived = category_in.is_archived

        db.commit()
        db.refresh(category)
        cat_out = CategoryOut.model_validate(category)
        cat_out.is_system = False
        return cat_out

    @staticmethod
    def delete_or_archive_category(db: Session, user_id: str, category_id: str) -> None:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
        if category.user_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System categories cannot be deleted.")
        if category.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this category.")

        tx_count = db.query(Transaction).filter(Transaction.category_id == category_id).count()
        if tx_count > 0:
            category.is_archived = True
            db.commit()
        else:
            db.delete(category)
            db.commit()
