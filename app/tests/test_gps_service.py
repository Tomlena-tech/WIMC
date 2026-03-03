"""
Tests unitaires - GPS Service
Couvre : update_child_gps, get_child_last_position,
         calculate_distance, is_child_in_safe_zone,
         get_history_days, get_gps_history
"""
import pytest
from datetime import datetime, timezone, date
from app.services.gps_service import (
    update_child_gps,
    get_child_last_position,
    calculate_distance,
    is_child_in_safe_zone,
    get_history_days,
    get_gps_history
)
from app.schemas.gps import GPSUpdate
from app.models.location import Location


# ─── update_child_gps ───────────────────────────────────────────────────────

def test_update_child_gps_success(db, test_child):
    """Met à jour la position GPS d'un enfant"""
    gps_data = GPSUpdate(latitude=44.8378, longitude=-0.5792, battery=80, timestamp="2026-03-03T12:00:00Z")
    result = update_child_gps(db, test_child.id, gps_data)

    assert result.latitude == 44.8378
    assert result.longitude == -0.5792
    assert result.battery == 80
    assert result.child_id == test_child.id


def test_update_child_gps_not_found(db):
    """Erreur 404 si enfant introuvable"""
    from fastapi import HTTPException
    gps_data = GPSUpdate(latitude=44.8378, longitude=-0.5792, battery=80, timestamp="2026-03-03T12:00:00Z")
    with pytest.raises(HTTPException) as exc:
        update_child_gps(db, 9999, gps_data)
    assert exc.value.status_code == 404


def test_update_child_gps_saves_history(db, test_child):
    """Vérifie que la position est sauvegardée dans GPSHistory"""
    from app.models.gps_history import GPSHistory
    gps_data = GPSUpdate(latitude=44.8378, longitude=-0.5792, battery=75, timestamp="2026-03-03T12:00:00Z")
    update_child_gps(db, test_child.id, gps_data)

    history = db.query(GPSHistory).filter(
        GPSHistory.child_id == test_child.id
    ).all()
    assert len(history) == 1
    assert history[0].latitude == 44.8378


# ─── get_child_last_position ────────────────────────────────────────────────

def test_get_last_position_success(db, test_child):
    """Récupère la dernière position connue"""
    gps_data = GPSUpdate(latitude=44.843, longitude=-0.555, battery=60, timestamp="2026-03-03T12:00:00Z")
    update_child_gps(db, test_child.id, gps_data)

    result = get_child_last_position(db, test_child.id)
    assert result.latitude == 44.843
    assert result.longitude == -0.555


def test_get_last_position_not_found(db):
    """Erreur 404 si enfant introuvable"""
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        get_child_last_position(db, 9999)
    assert exc.value.status_code == 404


# ─── calculate_distance (Haversine) ─────────────────────────────────────────

def test_calculate_distance_same_point():
    """Distance entre deux points identiques = 0"""
    d = calculate_distance(44.8378, -0.5792, 44.8378, -0.5792)
    assert d == 0.0


def test_calculate_distance_known_points():
    """Distance approximative entre Bordeaux et Paris ~500km"""
    d = calculate_distance(44.8378, -0.5792, 48.8566, 2.3522)
    assert 490000 < d < 510000


def test_calculate_distance_short():
    """Distance courte ~100m"""
    d = calculate_distance(44.8378, -0.5792, 44.8387, -0.5792)
    assert 50 < d < 200


# ─── is_child_in_safe_zone ──────────────────────────────────────────────────

def test_child_in_safe_zone(db, test_child):
    """Enfant dans la zone de sécurité"""
    zone = Location(
        name="École",
        latitude=44.8378,
        longitude=-0.5792,
        radius=200,
        child_id=test_child.id
    )
    db.add(zone)
    db.commit()

    gps_data = GPSUpdate(latitude=44.8379, longitude=-0.5793, battery=90, timestamp="2026-03-03T12:00:00Z")
    update_child_gps(db, test_child.id, gps_data)

    result = is_child_in_safe_zone(db, test_child.id)
    assert result["in_safe_zone"] is True
    assert result["zone_name"] == "École"


def test_child_outside_safe_zone(db, test_child):
    """Enfant hors de la zone de sécurité"""
    zone = Location(
        name="Maison",
        latitude=44.8378,
        longitude=-0.5792,
        radius=50,
        child_id=test_child.id
    )
    db.add(zone)
    db.commit()

    # Position loin de la zone
    gps_data = GPSUpdate(latitude=48.8566, longitude=2.3522, battery=50, timestamp="2026-03-03T12:00:00Z")
    update_child_gps(db, test_child.id, gps_data)

    result = is_child_in_safe_zone(db, test_child.id)
    assert result["in_safe_zone"] is False


# ─── get_history_days ───────────────────────────────────────────────────────

def test_get_history_days_empty(db, test_child):
    """Aucun historique = liste vide"""
    result = get_history_days(db, test_child.id)
    assert result == []


def test_get_history_days_after_update(db, test_child):
    """Un jour avec des données GPS"""
    gps_data = GPSUpdate(latitude=44.843, longitude=-0.555, battery=70, timestamp="2026-03-03T12:00:00Z")
    update_child_gps(db, test_child.id, gps_data)

    result = get_history_days(db, test_child.id)
    assert len(result) == 1
    assert str(date.today()) in result[0]


# ─── get_gps_history ────────────────────────────────────────────────────────

def test_get_gps_history_empty(db, test_child):
    """Aucun historique pour aujourd'hui"""
    result = get_gps_history(db, test_child.id, date.today())
    assert result == []


def test_get_gps_history_returns_points(db, test_child):
    """Historique retourne les points du jour"""
    gps_data = GPSUpdate(latitude=44.843, longitude=-0.555, battery=65, timestamp="2026-03-03T12:00:00Z")
    update_child_gps(db, test_child.id, gps_data)

    result = get_gps_history(db, test_child.id, date.today())
    assert len(result) >= 1
    assert result[0].latitude == 44.843

