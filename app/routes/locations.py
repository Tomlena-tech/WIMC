from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.location import LocationCreate, LocationResponse
from app.models.location import Location
from app.models.child import Child
from app.models.user import User

router = APIRouter(prefix="/places", tags=["places"])


@router.post("/", response_model=LocationResponse, status_code=201)
def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une location pour un enfant du parent connecté"""
    # Vérifier que le child_id appartient bien au parent
    child = db.query(Child).filter(
        Child.id == location_data.child_id,
        Child.parent_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found or not yours")
    
    new_location = Location(
        name=location_data.name,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        description=location_data.description,
        child_id=location_data.child_id
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location


@router.get("/", response_model=List[LocationResponse])
def get_my_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer toutes les locations de tous les enfants du parent"""
    # Récupérer les IDs des enfants du parent
    child_ids = [child.id for child in current_user.children]
    
    # Récupérer les locations de ces enfants
    locations = db.query(Location).filter(Location.child_id.in_(child_ids)).all()
    return locations


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une location spécifique"""
    child_ids = [child.id for child in current_user.children]
    
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.child_id.in_(child_ids)
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    return location


@router.delete("/{location_id}", status_code=204)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une location"""
    child_ids = [child.id for child in current_user.children]
    
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.child_id.in_(child_ids)
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    db.delete(location)
    db.commit()
    return None
