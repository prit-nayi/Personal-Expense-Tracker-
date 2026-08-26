from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.seed import seed_default_categories
from app.schemas.user import UserCreate, UserLogin, UserOut, UserUpdate, PasswordChange, Token
from app.services.auth_service import AuthService
from app.core.security import create_access_token
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Ensure default system categories are seeded in the database
    seed_default_categories(db)
    user = AuthService.register_user(db, user_in)
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, credentials)
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.put("/me", response_model=UserOut)
def update_profile(
    update_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = AuthService.update_profile(db, current_user, update_in)
    return UserOut.model_validate(user)

@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    pwd_in: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    AuthService.change_password(db, current_user, pwd_in)
    return {"message": "Password updated successfully."}
