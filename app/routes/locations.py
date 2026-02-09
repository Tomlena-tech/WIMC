from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate
from app.models.user import User
from app.services.location_service import (
    create_location,
    get_locations_by_parent,
    get_location_by_id,
    update_location,
    delete_location
)

router = APIRouter(prefix="/places", tags=["places"])


@router.post("/", response_model=LocationResponse, status_code=201)
def create_location_endpoint(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une location pour un enfant du parent connecté"""
    return create_location(db, location_data, current_user.id)


@router.get("/", response_model=List[LocationResponse])
def get_my_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer toutes les locations de tous les enfants du parent"""
    return get_locations_by_parent(db, current_user.id)


@router.get("/{location_id}", response_model=LocationResponse)
def get_location_endpoint(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une location spécifique"""
    return get_location_by_id(db, location_id, current_user.id)


@router.put("/{location_id}", response_model=LocationResponse)
def update_location_endpoint(
    location_id: int,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifier une location"""
    return update_location(db, location_id, current_user.id, location_data)


@router.delete("/{location_id}", status_code=204)
def delete_location_endpoint(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une location"""
    delete_location(db, location_id, current_user.id)
