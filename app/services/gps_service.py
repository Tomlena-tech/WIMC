from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import timezone, datetime, date
from typing import Optional
from app.models.child import Child
from app.schemas.gps import GPSUpdate, GPSResponse
from app.models.gps_history import GPSHistory
import math
import httpx
import os


def update_child_gps(
    db: Session, 
    child_id: int, 
    gps_data: GPSUpdate
) -> GPSResponse:
    """Mettre à jour la position GPS d'un enfant"""
    
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    child.last_latitude = gps_data.latitude
    child.last_longitude = gps_data.longitude
    child.last_update = datetime.now(timezone.utc)
    child.battery = gps_data.battery
    
    db.commit()
    db.refresh(child)
    
    history_entry = GPSHistory(
        child_id=child.id,
        latitude=gps_data.latitude,
        longitude=gps_data.longitude,
        battery=gps_data.battery
    )
    db.add(history_entry)
    db.commit()

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


def get_history_days(db: Session, child_id: int) -> list:
    """Retourne la liste des jours avec des données GPS pour un enfant"""
    from sqlalchemy import cast
    from sqlalchemy.types import Date
    
    rows = db.query(
        cast(GPSHistory.timestamp, Date).label("day")
    ).filter(
        GPSHistory.child_id == child_id
    ).distinct().order_by(
        cast(GPSHistory.timestamp, Date).desc()
    ).limit(30).all()
    
    return [str(row.day) for row in rows]


def get_gps_history(
    db: Session,
    child_id: int,
    day: Optional[date] = None,
    interval_seconds: int = 30
) -> list:
    """Historique GPS d'un enfant pour un jour donné, sous-échantillonné"""
    
    target_day = day or date.today()
    start = datetime(target_day.year, target_day.month, target_day.day, tzinfo=timezone.utc)
    end = datetime(target_day.year, target_day.month, target_day.day, 23, 59, 59, tzinfo=timezone.utc)
    
    points = db.query(GPSHistory).filter(
        GPSHistory.child_id == child_id,
        GPSHistory.timestamp >= start,
        GPSHistory.timestamp <= end
    ).order_by(GPSHistory.timestamp.asc()).all()
    
    if not points:
        return []
    
    # Sous-échantillonnage : 1 point toutes les N secondes
    sampled = [points[0]]
    for p in points[1:]:
        delta = (p.timestamp - sampled[-1].timestamp).total_seconds()
        if delta >= interval_seconds:
            sampled.append(p)
    
    return sampled


async def snap_to_roads(points: list) -> list:
    """Snap les points GPS aux routes via Google Roads API"""
    
    key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not key:
        return [{"latitude": p.latitude, "longitude": p.longitude} for p in points]
    
    snapped = []
    
    async with httpx.AsyncClient() as client:
        for i in range(0, len(points), 100):
            chunk = points[i:i+100]
            path = "|".join([f"{p.latitude},{p.longitude}" for p in chunk])
            
            res = await client.get(
                "https://roads.googleapis.com/v1/snapToRoads",
                params={
                    "path": path,
                    "interpolate": "true",
                    "key": key
                }
            )
            data = res.json()
            snapped += [
                {
                    "latitude": p["location"]["latitude"],
                    "longitude": p["location"]["longitude"]
                }
                for p in data.get("snappedPoints", [])
            ]
    
    return snapped


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance en mètres entre deux points GPS (formule Haversine)"""
    R = 6371000
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
