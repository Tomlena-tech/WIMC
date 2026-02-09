"""
Service de gestion des enfants
Contient toute la logique métier pour les opérations CRUD sur les enfants
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.child import Child
from typing import List, Optional


def create_child(db: Session, child_data, parent_id: int) -> Child:
    """
    Crée un nouvel enfant pour un parent
    
    Args:
        db: Session de base de données
        child_data: Données de l'enfant (ChildCreate schema)
        parent_id: ID du parent propriétaire
    
    Returns:
        Child: L'enfant créé
    """
    child = Child(**child_data.dict(), parent_id=parent_id)
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


def get_children_by_parent(db: Session, parent_id: int) -> List[Child]:
    """
    Récupère tous les enfants d'un parent
    
    Args:
        db: Session de base de données
        parent_id: ID du parent
    
    Returns:
        List[Child]: Liste des enfants du parent
    """
    return db.query(Child).filter(Child.parent_id == parent_id).all()


def get_child_by_id(db: Session, child_id: int, parent_id: int) -> Child:
    """
    Récupère un enfant spécifique (avec vérification propriétaire)
    
    Args:
        db: Session de base de données
        child_id: ID de l'enfant
        parent_id: ID du parent (pour vérifier la propriété)
    
    Returns:
        Child: L'enfant demandé
    
    Raises:
        HTTPException 404: Si l'enfant n'existe pas ou n'appartient pas au parent
    """
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == parent_id
    ).first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return child


def update_child(db: Session, child_id: int, parent_id: int, child_data) -> Child:
    """
    Met à jour un enfant
    
    Args:
        db: Session de base de données
        child_id: ID de l'enfant à modifier
        parent_id: ID du parent (pour vérifier la propriété)
        child_data: Nouvelles données (ChildUpdate schema)
    
    Returns:
        Child: L'enfant modifié
    
    Raises:
        HTTPException 404: Si l'enfant n'existe pas ou n'appartient pas au parent
    """
    # Récupérer l'enfant (avec vérification propriétaire)
    child = get_child_by_id(db, child_id, parent_id)
    
    # Mettre à jour les champs fournis
    for key, value in child_data.dict(exclude_unset=True).items():
        setattr(child, key, value)
    
    db.commit()
    db.refresh(child)
    return child


def delete_child(db: Session, child_id: int, parent_id: int) -> None:
    """
    Supprime un enfant (et toutes ses locations en cascade)
    
    Args:
        db: Session de base de données
        child_id: ID de l'enfant à supprimer
        parent_id: ID du parent (pour vérifier la propriété)
    
    Raises:
        HTTPException 404: Si l'enfant n'existe pas ou n'appartient pas au parent
    """
    # Récupérer l'enfant (avec vérification propriétaire)
    child = get_child_by_id(db, child_id, parent_id)
    
    # Supprimer l'enfant
    db.delete(child)
    db.commit()
