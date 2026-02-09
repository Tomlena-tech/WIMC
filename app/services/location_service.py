"""
Service de gestion des locations (lieux)
Contient toute la logique métier pour les opérations CRUD sur les locations
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.location import Location
from app.models.child import Child
from typing import List


def verify_child_ownership(
    db: Session, child_id: int, parent_id: int
) -> Child:
    """
    Vérifie qu'un enfant appartient bien à un parent

    Args:
        db: Session de base de données
        child_id: ID de l'enfant
        parent_id: ID du parent

    Returns:
        Child: L'enfant si propriétaire vérifié

    Raises:
        HTTPException 404: Si l'enfant n'existe pas ou n'appartient 
        pas au parent
    """
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=404,
            detail="Child not found or not yours"
        )

    return child


def create_location(db: Session, location_data, parent_id: int) -> Location:
    """
    Crée une nouvelle location pour un enfant (avec vérification propriété)

    Args:
        db: Session de base de données
        location_data: Données de la location (LocationCreate schema)
        parent_id: ID du parent (pour vérifier la propriété de l'enfant)

    Returns:
        Location: La location créée

    Raises:
        HTTPException 404: Si l'enfant n'appartient pas au parent
    """
    # Vérifier que l'enfant appartient au parent
    verify_child_ownership(db, location_data.child_id, parent_id)

    # Créer la location
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


def get_locations_by_parent(db: Session, parent_id: int) -> List[Location]:
    """
    Récupère toutes les locations de tous les enfants d'un parent

    Args:
        db: Session de base de données
        parent_id: ID du parent

    Returns:
        List[Location]: Liste des locations
    """
    # Récupérer les IDs des enfants du parent
    child_ids = db.query(Child.id).filter(Child.parent_id == parent_id).all()
    child_ids = [child_id[0] for child_id in child_ids]

    # Récupérer les locations de ces enfants
    locations = db.query(Location).filter(
        Location.child_id.in_(child_ids)
    ).all()

    return locations


def get_location_by_id(
    db: Session, location_id: int, parent_id: int
) -> Location:
    """
    Récupère une location spécifique (avec vérification propriété)

    Args:
        db: Session de base de données
        location_id: ID de la location
        parent_id: ID du parent (pour vérifier la propriété)

    Returns:
        Location: La location demandée

    Raises:
        HTTPException 404: Si la location n'existe pas ou l'enfant n'appartient
        pas au parent
    """
    # Récupérer les IDs des enfants du parent
    child_ids = db.query(Child.id).filter(Child.parent_id == parent_id).all()
    child_ids = [child_id[0] for child_id in child_ids]

    # Récupérer la location
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.child_id.in_(child_ids)
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    return location


def update_location(
    db: Session,
    location_id: int,
    parent_id: int,
    location_data
) -> Location:
    """
    Met à jour une location (avec vérification propriété)

    Args:
        db: Session de base de données
        location_id: ID de la location à modifier
        parent_id: ID du parent (pour vérifier la propriété)
        location_data: Nouvelles données (LocationUpdate schema)

    Returns:
        Location: La location modifiée

    Raises:
        HTTPException 404: Si la location n'existe pas ou l'enfant n'appartient
        pas au parent
    """
    # Récupérer la location (avec vérification propriété)
    location = get_location_by_id(db, location_id, parent_id)

    # Mettre à jour les champs fournis
    for key, value in location_data.dict(exclude_unset=True).items():
        setattr(location, key, value)

    db.commit()
    db.refresh(location)
    return location


def delete_location(db: Session, location_id: int, parent_id: int) -> None:
    """
    Supprime une location (avec vérification propriété)

    Args:
        db: Session de base de données
        location_id: ID de la location à supprimer
        parent_id: ID du parent (pour vérifier la propriété)

    Raises:
        HTTPException 404: Si la location n'existe pas ou l'enfant n'appartient
        pas au parent
    """
    # Récupérer la location (avec vérification propriété)
    location = get_location_by_id(db, location_id, parent_id)

    # Supprimer la location
    db.delete(location)
    db.commit()
