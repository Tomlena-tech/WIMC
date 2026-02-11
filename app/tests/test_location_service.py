"""
Tests pour location_service.py
"""
import pytest
from fastapi import HTTPException
from app.services.location_service import (
    create_location,
    get_locations_by_parent,
    get_location_by_id,
    update_location,
    delete_location
)
from app.schemas.location import LocationCreate, LocationUpdate


def test_create_location(db, test_user, test_child):
    """Test : Création d'une location"""
    location_data = LocationCreate(
        name="Home",
        latitude=45.5,
        longitude=3.2,
        description="Test location",
        child_id=test_child.id
    )
    location = create_location(db, location_data, test_user.id)
    
    assert location.name == "Home"
    assert location.latitude == 45.5
    assert location.child_id == test_child.id


def test_create_location_wrong_parent(db, test_child):
    """Test : Création avec mauvais parent → erreur 404"""
    location_data = LocationCreate(
        name="Home",
        latitude=45.5,
        longitude=3.2,
        child_id=test_child.id
    )
    wrong_parent_id = 999
    
    with pytest.raises(HTTPException) as exc_info:
        create_location(db, location_data, wrong_parent_id)
    
    assert exc_info.value.status_code == 404


def test_get_locations_by_parent(db, test_user, test_child):
    """Test : Récupération des locations d'un parent"""
    location_data = LocationCreate(
        name="Home",
        latitude=45.5,
        longitude=3.2,
        child_id=test_child.id
    )
    create_location(db, location_data, test_user.id)
    
    locations = get_locations_by_parent(db, test_user.id)
    
    assert len(locations) == 1
    assert locations[0].name == "Home"


def test_get_location_by_id_success(db, test_user, test_child):
    """Test : Récupération d'une location par ID"""
    location_data = LocationCreate(
        name="Home",
        latitude=45.5,
        longitude=3.2,
        child_id=test_child.id
    )
    created = create_location(db, location_data, test_user.id)
    
    location = get_location_by_id(db, created.id, test_user.id)
    
    assert location.id == created.id
    assert location.name == "Home"


def test_update_location(db, test_user, test_child):
    """Test : Modification d'une location"""
    location_data = LocationCreate(
        name="Home",
        latitude=45.5,
        longitude=3.2,
        child_id=test_child.id
    )
    created = create_location(db, location_data, test_user.id)
    
    update_data = LocationUpdate(name="Updated Home")
    updated = update_location(db, created.id, test_user.id, update_data)
    
    assert updated.name == "Updated Home"
    assert updated.latitude == 45.5


def test_delete_location(db, test_user, test_child):
    """Test : Suppression d'une location"""
    location_data = LocationCreate(
        name="Home",
        latitude=45.5,
        longitude=3.2,
        child_id=test_child.id
    )
    created = create_location(db, location_data, test_user.id)
    
    delete_location(db, created.id, test_user.id)
    
    with pytest.raises(HTTPException):
        get_location_by_id(db, created.id, test_user.id)
