from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import timezone, datetime
from app.models.child import Child
from app.schemas.gps import GPSUpdate, GPSResponse


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
