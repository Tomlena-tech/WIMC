from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import UserCreate, UserResponse, LoginRequest
from app.models.user import User
from app.services.auth_service import (
    authenticate_user,
    generate_auth_tokens,
    create_user
)
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Enregistre un nouvel utilisateur
    """
    # Appeler le service pour créer le user
    new_user = create_user(db, user_data)
    
    # Retourner le user créé
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
