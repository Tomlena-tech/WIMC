from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.schemas import UserCreate, UserResponse
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


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
def login(email: str, password: str, db: Session = Depends(get_db)):
    # Trouve le user
    user = db.query(User).filter(User.email == email).first()
    # Vérifie user existe
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Vérifie password
    if not verify_password(password, str(user.hashed_password)):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Crée le token
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    return {"access_token": token, "token_type": "bearer"}
