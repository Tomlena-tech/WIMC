"""
Tests avancés pour la géolocalisation - CŒUR de WIMC
"""
import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from app.services.location_service import (
    create_location,
    get_locations_by_parent,
    verify_child_ownership
)
from app.schemas.location import LocationCreate


def test_latitude_validation_too_high(db, test_user, test_child):
    """Test : Latitude > 90 → erreur validation"""
    with pytest.raises(ValidationError) as exc_info:
        LocationCreate(
            name="Invalid",
            latitude=100.0,  # > 90
            longitude=3.2,
            child_id=test_child.id
        )
    
    assert "latitude" in str(exc_info.value)


def test_latitude_validation_too_low(db, test_user, test_child):
    """Test : Latitude < -90 → erreur validation"""
    with pytest.raises(ValidationError) as exc_info:
        LocationCreate(
            name="Invalid",
            latitude=-100.0,  # < -90
            longitude=3.2,
            child_id=test_child.id
        )
    
    assert "latitude" in str(exc_info.value)


def test_longitude_validation_too_high(db, test_user, test_child):
    """Test : Longitude > 180 → erreur validation"""
    with pytest.raises(ValidationError) as exc_info:
        LocationCreate(
            name="Invalid",
            latitude=45.5,
            longitude=200.0,  # > 180
            child_id=test_child.id
        )
    
    assert "longitude" in str(exc_info.value)


def test_longitude_validation_too_low(db, test_user, test_child):
    """Test : Longitude < -180 → erreur validation"""
    with pytest.raises(ValidationError) as exc_info:
        LocationCreate(
            name="Invalid",
            latitude=45.5,
            longitude=-200.0,  # < -180
            child_id=test_child.id
        )
    
    assert "longitude" in str(exc_info.value)


def test_valid_extreme_coordinates_north_pole(db, test_user, test_child):
    """Test : Pôle Nord (90, 0) → valide"""
    location_data = LocationCreate(
        name="North Pole",
        latitude=90.0,
        longitude=0.0,
        child_id=test_child.id
    )
    location = create_location(db, location_data, test_user.id)
    
    assert location.latitude == 90.0
    assert location.longitude == 0.0


def test_valid_extreme_coordinates_south_pole(db, test_user, test_child):
    """Test : Pôle Sud (-90, 0) → valide"""
    location_data = LocationCreate(
        name="South Pole",
        latitude=-90.0,
        longitude=0.0,
        child_id=test_child.id
    )
    location = create_location(db, location_data, test_user.id)
    
    assert location.latitude == -90.0


def test_valid_extreme_coordinates_date_line(db, test_user, test_child):
    """Test : Ligne de changement de date (0, 180) → valide"""
    location_data = LocationCreate(
        name="Date Line",
        latitude=0.0,
        longitude=180.0,
        child_id=test_child.id
    )
    location = create_location(db, location_data, test_user.id)
    
    assert location.longitude == 180.0


def test_verify_child_ownership_success(db, test_user, test_child):
    """Test : Vérification ownership OK"""
    # Ne doit pas lever d'exception
    verify_child_ownership(db, test_child.id, test_user.id)


def test_verify_child_ownership_wrong_parent(db, test_child):
    """Test : Vérification ownership KO → erreur 404"""
    wrong_parent_id = 999
    
    with pytest.raises(HTTPException) as exc_info:
        verify_child_ownership(db, test_child.id, wrong_parent_id)
    
    assert exc_info.value.status_code == 404
    assert "Child not found or not yours" in exc_info.value.detail


def test_multiple_locations_same_child(db, test_user, test_child):
    """Test : Historique de positions (plusieurs locations pour un enfant)"""
    # Créer 3 positions différentes
    locations_data = [
        LocationCreate(name="Home", latitude=45.5, longitude=3.2, child_id=test_child.id),
        LocationCreate(name="School", latitude=45.6, longitude=3.3, child_id=test_child.id),
        LocationCreate(name="Park", latitude=45.7, longitude=3.4, child_id=test_child.id),
    ]
    
    for loc_data in locations_data:
        create_location(db, loc_data, test_user.id)
    
    # Récupérer toutes les locations
    locations = get_locations_by_parent(db, test_user.id)
    
    assert len(locations) == 3
    assert locations[0].name == "Home"
    assert locations[1].name == "School"
    assert locations[2].name == "Park"


def test_location_precision_decimals(db, test_user, test_child):
    """Test : Précision GPS (6 décimales = ~10cm)"""
    location_data = LocationCreate(
        name="Precise Location",
        latitude=45.123456,  # 6 décimales
        longitude=-1.234567,
        child_id=test_child.id
    )
    location = create_location(db, location_data, test_user.id)
    
    # Vérifier que la précision est conservée
    assert location.latitude == 45.123456
    assert location.longitude == -1.234567
