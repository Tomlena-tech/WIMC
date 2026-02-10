from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class GPSUpdate(BaseModel):
    """Schema pour recevoir position GPS de l'émetteur"""
    latitude: float
    longitude: float
    timestamp: str  # ISO format


class GPSResponse(BaseModel):
    """Schema de réponse position GPS"""
    child_id: int
    latitude: Optional[float]
    longitude: Optional[float]
    last_update: Optional[datetime]
    
    class Config:
        from_attributes = True
