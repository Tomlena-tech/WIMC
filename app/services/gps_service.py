from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import timezone, datetime
from app.models.child import Child
from app.schemas.gps import GPSUpdate, GPSResponse
import math

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


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance en mètres entre deux points GPS (formule Haversine)"""
    R = 6371000  # Rayon de la Terre en mètres
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))    


def is_child_in_safe_zone(db: Session, child_id: int) -> dict:
    """Vérifie si un enfant est dans une zone de confiance"""
    
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    if not child.last_latitude or not child.last_longitude:
        return {"in_safe_zone": False, "zone_name": None}
    
    from app.models.location import Location
    zones = db.query(Location).filter(Location.child_id == child_id).all()
    
    for zone in zones:
        distance = calculate_distance(
            child.last_latitude, child.last_longitude,
            zone.latitude, zone.longitude
        )
        if distance <= zone.radius:
            return {"in_safe_zone": True, "zone_name": zone.name}
    
    return {"in_safe_zone": False, "zone_name": None}
