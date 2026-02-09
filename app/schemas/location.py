from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class LocationBase(BaseModel):
    name: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    description: Optional[str] = None


class LocationCreate(LocationBase):
    child_id: int


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


class LocationResponse(LocationBase):
    id: int
    child_id: int
    created_at: datetime

    class Config:
        from_attributes = True
