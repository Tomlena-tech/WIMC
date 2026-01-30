from pydantic import BaseModel
from datetime import datetime


class LocationBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    description: str | None = None


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
