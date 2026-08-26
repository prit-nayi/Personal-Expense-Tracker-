from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserUpdate, PasswordChange
from app.core.security import verify_password, get_password_hash, create_access_token

class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        existing_user = AuthService.get_user_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
        user = User(
            email=user_in.email.lower().strip(),
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            currency_code=user_in.currency_code.upper() if user_in.currency_code else "USD",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> User:
        user = AuthService.get_user_by_email(db, credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated."
            )
        return user

    @staticmethod
    def update_profile(db: Session, user: User, update_in: UserUpdate) -> User:
        if update_in.full_name is not None:
            user.full_name = update_in.full_name
        if update_in.currency_code is not None:
            user.currency_code = update_in.currency_code.upper()
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user: User, pwd_in: PasswordChange) -> None:
        if not verify_password(pwd_in.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password does not match."
            )
        user.hashed_password = get_password_hash(pwd_in.new_password)
        db.commit()
