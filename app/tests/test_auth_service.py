"""
Tests pour auth_service.py
"""
import pytest
from fastapi import HTTPException
from app.services.auth_service import (
    authenticate_user,
    generate_auth_tokens,
    create_user
)
from app.schemas.auth import UserCreate


def test_authenticate_user_with_valid_credentials(db, test_user):
    """Test : Authentification avec bon email + password"""
    user = authenticate_user(db, "test@test.com", "password123")
    
    assert user is not None
    assert user.email == "test@test.com"
    assert user.id == test_user.id


def test_authenticate_user_with_wrong_password(db, test_user):
    """Test : Authentification avec mauvais password → erreur 401"""
    with pytest.raises(HTTPException) as exc_info:
        authenticate_user(db, "test@test.com", "wrongpassword")
    
    assert exc_info.value.status_code == 401
    assert "Invalid credentials" in exc_info.value.detail


def test_authenticate_user_with_non_existent_email(db):
    """Test : Authentification avec email inexistant → erreur 401"""
    with pytest.raises(HTTPException) as exc_info:
        authenticate_user(db, "nonexistent@test.com", "password123")
    
    assert exc_info.value.status_code == 401


def test_generate_auth_tokens(test_user):
    """Test : Génération des tokens JWT"""
    tokens = generate_auth_tokens(test_user)
    
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert "token_type" in tokens
    assert tokens["token_type"] == "bearer"
    assert tokens["user_id"] == test_user.id
    assert tokens["email"] == test_user.email


def test_create_user_success(db):
    """Test : Création d'un nouvel utilisateur"""
    user_data = UserCreate(
        email="newuser@test.com",
        username="newuser",
        password="newpassword123"
    )
    
    user = create_user(db, user_data)
    
    assert user.email == "newuser@test.com"
    assert user.username == "newuser"
    assert user.id is not None


def test_create_user_duplicate_email(db, test_user):
    """Test : Création avec email déjà existant → erreur 400"""
    user_data = UserCreate(
        email="test@test.com",  # Email déjà utilisé
        username="anotheruser",
        password="password123"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        create_user(db, user_data)
    
    assert exc_info.value.status_code == 400
    assert "Email already exists" in exc_info.value.detail


def test_create_user_duplicate_username(db, test_user):
    """Test : Création avec username déjà existant → erreur 400"""
    user_data = UserCreate(
        email="another@test.com",
        username="testuser",  # Username déjà utilisé
        password="password123"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        create_user(db, user_data)
    
    assert exc_info.value.status_code == 400
    assert "Username already exists" in exc_info.value.detail
