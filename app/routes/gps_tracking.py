from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.gps import GPSUpdate, GPSResponse
from app.services.gps_service import (
    update_child_gps,
    get_child_last_position,
    is_child_in_safe_zone
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
