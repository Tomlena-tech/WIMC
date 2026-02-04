from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class ChildBase(BaseModel):
    name: str
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class ChildCreate(ChildBase):
    pass


class ChildUpdate(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class ChildResponse(ChildBase):
    id: int
    parent_id: int
    created_at: datetime
    battery: Optional[int] = 100

    
    class Config:
        from_attributes = True
