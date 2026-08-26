from sqlalchemy.orm import Session
from app.models.category import Category

DEFAULT_CATEGORIES = [
    # Expense categories
    {"name": "Food & Dining", "type": "expense", "icon": "Utensils", "color": "#F59E0B"},
    {"name": "Housing & Rent", "type": "expense", "icon": "Home", "color": "#3B82F6"},
    {"name": "Transportation", "type": "expense", "icon": "Car", "color": "#6366F1"},
    {"name": "Utilities & Bills", "type": "expense", "icon": "Zap", "color": "#EC4899"},
    {"name": "Shopping & Groceries", "type": "expense", "icon": "ShoppingBag", "color": "#10B981"},
    {"name": "Healthcare & Fitness", "type": "expense", "icon": "Heart", "color": "#EF4444"},
    {"name": "Entertainment & Leisure", "type": "expense", "icon": "Film", "color": "#8B5CF6"},
    {"name": "Education", "type": "expense", "icon": "BookOpen", "color": "#06B6D4"},
    {"name": "Personal Care", "type": "expense", "icon": "Sparkles", "color": "#F97316"},
    {"name": "Miscellaneous", "type": "expense", "icon": "MoreHorizontal", "color": "#6B7280"},
    # Income categories
    {"name": "Salary", "type": "income", "icon": "Briefcase", "color": "#10B981"},
    {"name": "Freelance & Consulting", "type": "income", "icon": "Laptop", "color": "#3B82F6"},
    {"name": "Investments & Dividends", "type": "income", "icon": "TrendingUp", "color": "#8B5CF6"},
    {"name": "Gifts & Grants", "type": "income", "icon": "Gift", "color": "#EC4899"},
    {"name": "Other Income", "type": "income", "icon": "PlusCircle", "color": "#14B8A6"},
]

def seed_default_categories(db: Session) -> None:
    for cat_data in DEFAULT_CATEGORIES:
        existing = db.query(Category).filter(
            Category.user_id.is_(None),
            Category.name == cat_data["name"],
            Category.type == cat_data["type"]
        ).first()
        if not existing:
            cat = Category(
                user_id=None,
                name=cat_data["name"],
                type=cat_data["type"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                is_archived=False
            )
            db.add(cat)
    db.commit()
