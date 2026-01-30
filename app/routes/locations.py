from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.location import LocationCreate, LocationResponse
from app.models.location import Location

router = APIRouter(prefix="/places", tags=["places"])


@router.post("/", response_model=LocationResponse, status_code=201)
def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    new_location = Location(
        name=location_data.name,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        description=location_data.description,
        user_id=current_user["user_id"]
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location


"""Create own road with my own locations"""


@router.get("/", response_model=list[LocationResponse])
def get_my_locations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):  # line too long !
    locations = db.query(Location).filter(Location.user_id == current_user["user_id"]).all()
    return locations


""" get a location choosen (id)"""


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user["user_id"]
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    return location


""" Delete a choosen location"""


@router.delete("/{location_id}", status_code=204)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user["user_id"]
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    db.delete(location)
    db.commit()
    return None
