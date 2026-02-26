from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.core.database import get_db
from app.schemas.gps import GPSUpdate, GPSResponse
from app.services.gps_service import (
    update_child_gps,
    get_child_last_position,
    is_child_in_safe_zone,
    get_gps_history,
    get_history_days,
    snap_to_roads
)

router = APIRouter(prefix="/gps", tags=["gps-tracking"])


@router.post("/children/{child_id}/update", response_model=GPSResponse)
async def update_gps_endpoint(
    child_id: int,
    gps_data: GPSUpdate,
    db: Session = Depends(get_db)
):
    """Endpoint pour recevoir les positions GPS de l'émetteur iPhone"""
    return update_child_gps(db, child_id, gps_data)


@router.get("/children/{child_id}/last-position", response_model=GPSResponse)
async def get_last_position_endpoint(
    child_id: int,
    db: Session = Depends(get_db)
):
    """Récupérer la dernière position connue d'un enfant"""
    return get_child_last_position(db, child_id)


@router.get("/children/{child_id}/in-safe-zone")
async def check_safe_zone_endpoint(
    child_id: int,
    db: Session = Depends(get_db)
):
    """Vérifie si un enfant est dans une zone de confiance"""
    return is_child_in_safe_zone(db, child_id)


@router.get("/children/{child_id}/history/days")
def get_history_days_endpoint(
    child_id: int,
    db: Session = Depends(get_db)
):
    """Retourne la liste des jours avec des données GPS"""
    return get_history_days(db, child_id)


@router.get("/children/{child_id}/history")
async def get_child_history(
    child_id: int,
    day: Optional[date] = Query(default=None),
    interval_seconds: int = Query(default=30),
    snap: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    """Historique GPS d'un enfant, avec snap-to-roads optionnel"""
    points = get_gps_history(db, child_id, day, interval_seconds)
    
    if snap and points:
        return await snap_to_roads(points)
    
    return [
        {"latitude": p.latitude, "longitude": p.longitude, "timestamp": p.timestamp}
        for p in points
    ]
