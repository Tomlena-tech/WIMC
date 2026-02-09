"""
Service d'authentification
Contient toute la logique métier pour l'auth (login, register, tokens)
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token
)


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authentifie un utilisateur avec email + password
    
    Args:
        db: Session de base de données SQLAlchemy
        email: Email de l'utilisateur
        password: Mot de passe en clair (sera vérifié contre le hash)
    
    Returns:
        User: L'objet User si authentification réussie
    
    Raises:
        HTTPException 401: Si user n'existe pas ou password incorrect
    """
    # 1. Chercher le user par email
    user = db.query(User).filter(User.email == email).first()
    
    # 2. Vérifier que le user existe
    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Invalid credentials"
        )
    
    # 3. Vérifier le password
    if not verify_password(password, str(user.hashed_password)):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    # 4. Retourner le user authentifié
    return user


def generate_auth_tokens(user: User) -> dict:
    """
    Génère les tokens JWT pour un utilisateur authentifié
    
    Args:
        user: L'objet User pour lequel générer les tokens
    
    Returns:
        dict: Dictionnaire contenant access_token, refresh_token, et infos user
    """
    # 1. Créer l'access token (7 jours)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    # 2. Créer le refresh token (30 jours)
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    # 3. Construire la réponse complète
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 604800,  # 7 jours en secondes
        "user_id": user.id,
        "email": user.email
    }


def create_user(db: Session, user_data) -> User:
    """
    Crée un nouvel utilisateur après validation
    
    Args:
        db: Session de base de données SQLAlchemy
        user_data: Données utilisateur (UserCreate schema)
    
    Returns:
        User: Le nouvel utilisateur créé
    
    Raises:
        HTTPException 400: Si email ou username existe déjà
    """
    from app.core.security import hash_password
    
    # 1. Vérifier si l'email existe déjà
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )
    
    # 2. Vérifier si le username existe déjà
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )
    
    # 3. Hasher le password
    hashed_pwd = hash_password(user_data.password)
    
    # 4. Créer le nouvel utilisateur
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_pwd
    )
    
    # 5. Sauvegarder en base de données
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 6. Retourner le user créé
    return new_user
