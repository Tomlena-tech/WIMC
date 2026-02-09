from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.schemas import UserCreate, UserResponse, LoginRequest
from app.models.user import User
from app.services.auth_service import authenticate_user, generate_auth_tokens
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Enregistre un nouvel utilisateur
    """
    # Vérifier si email existe déjà
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    # Vérifier si username existe déjà
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Créer le nouveau user
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


@router.post("/login")
def login(
    request: Optional[LoginRequest] = None,  # Body JSON (mobile)
    email: Optional[str] = None,             # Query param (MCP)
    password: Optional[str] = None,          # Query param (MCP)
    db: Session = Depends(get_db)
):
    """
    Login endpoint supporting both:
    - Body JSON (secure, for mobile app)
    - Query params (for MCP compatibility)
    """
    # 1️⃣ Extraire les credentials (Body ou Query params)
    if request:
        user_email = request.email
        user_password = request.password
    elif email and password:
        user_email = email
        user_password = password
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide credentials via request body or query parameters"
        )

    # 2️⃣ Authentifier l'utilisateur (Service fait le travail !)
    user = authenticate_user(db, user_email, user_password)

    # 3️⃣ Générer les tokens (Service fait le travail !)
    tokens = generate_auth_tokens(user)

    # 4️⃣ Retourner la réponse
    return tokens
