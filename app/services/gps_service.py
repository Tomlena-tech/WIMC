from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import timezone, datetime
from app.models.child import Child
from app.schemas.gps import GPSUpdate, GPSResponse
from math import radians, sin, cos, sqrt, atan2


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance en mètres entre 2 points GPS (formule Haversine)"""
    R = 6371000  # Rayon de la Terre en mètres

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return R * c  # Distance en mètres


def update_child_gps(
    db: Session, 
    child_id: int, 
    gps_data: GPSUpdate
) -> GPSResponse:
    """Mettre à jour la position GPS d'un enfant"""

    # Vérifier que l'enfant existe
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Mettre à jour position
    child.last_latitude = gps_data.latitude
    child.last_longitude = gps_data.longitude
    child.last_update = datetime.now(timezone.utc)
    child.battery = gps_data.battery
    
    db.commit()
    db.refresh(child)
    
    return GPSResponse(
        child_id=child.id,
        latitude=child.last_latitude,
        longitude=child.last_longitude,
        last_update=child.last_update,
        battery=child.battery
    )


def get_child_last_position(
    db: Session, 
    child_id: int
) -> GPSResponse:
    """Récupérer la dernière position d'un enfant"""
    
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return GPSResponse(
        child_id=child.id,
        latitude=child.last_latitude,
        longitude=child.last_longitude,
        last_update=child.last_update,
        battery=child.battery
    )


def is_child_in_safe_zone(db: Session, child_id: int) -> bool:
    """Vérifie si l'enfant est dans une de ses zones de confiance"""
    from app.models.location import Location

    child = db.query(Child).filter(Child.id == child_id).first()
    if not child or not child.last_latitude or not child.last_longitude:
        return False

    # Récupérer toutes les zones de cet enfant
    zones = db.query(Location).filter(Location.child_id == child_id).all()

    for zone in zones:
        distance = calculate_distance(
            child.last_latitude, child.last_longitude,
            zone.latitude, zone.longitude
        )
        if distance <= zone.radius:
            return True  # Dans la zone !

    return False  # Hors de toutes les zones
