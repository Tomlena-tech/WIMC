from pydantic import BaseModel, EmailStr
from datetime import datetime

"""Model inheritance for the other"""


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime


"""Traduce from Pydantic data into SQL to json"""


class Config:
    from_attributes = True
