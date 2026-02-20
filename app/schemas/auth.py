from pydantic import BaseModel, EmailStr
from datetime import datetime


# ============================================
# USER SCHEMAS (Authentication & Profile)
# ============================================


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    username: str


class UserCreate(UserBase):
    """Schema for user registration (includes password)"""
    password: str


class UserResponse(UserBase):
    """Schema for user response (excludes password, includes DB fields)"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Permet conversion SQLAlchemy → Pydantic


# ============================================
# LOGIN SCHEMAS
# ============================================

class LoginRequest(BaseModel):
    """Schema for login request (email + password)"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Schema for login response (tokens + user info)"""
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user_id: int
    email: EmailStr

# ============================================
# REFRESH TOKEN
# ============================================


class RefreshRequest(BaseModel):
    refresh_token: str
