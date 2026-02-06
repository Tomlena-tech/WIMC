from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.schemas import UserCreate, UserResponse
from app.models.user import User
from typing import Optional
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # check if email already exists

    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pwd = hash_password(user_data.password)
    new_user = User(
     email=user_data.email,
     username=user_data.username,
     hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


""" endpoint auth/login"""


@router.post("/login")
def login(
    request: Optional[LoginRequest] = None,  # Body JSON (mobile)
    email: Optional[str] = None,             # Query param (MCP)
    password: Optional[str] = None,          # Query param (MCP)
    db: Session = Depends(get_db)
):
    """
    Login endpoint supporting both: 
    (On laisse le choix soit en body soit query params)
    - Body JSON (secure, for mobile app)
    - Query params (for MCP compatibility)
    """
    # Déterminer la source des credentials
    if request:
        # Mobile app utilise Body JSON (sécurisé)
        user_email = request.email
        user_password = request.password
    elif email and password:
        # MCP utilise Query params (compatibilité)
        user_email = email
        user_password = password
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide credentials via request body or query parameters"
        )

    # Trouve le user
    user = db.query(User).filter(User.email == user_email).first()

    # Vérifie user existe
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Vérifie password
    if not verify_password(user_password, str(user.hashed_password)):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Crée le token
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
)

    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 604800,
        "user_id": user.id,
        "email": user.email
    }
