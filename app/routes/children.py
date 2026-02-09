from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.child import ChildCreate, ChildResponse, ChildUpdate
from app.services.child_service import (
    create_child,
    get_children_by_parent,
    get_child_by_id,
    update_child,
    delete_child
)

router = APIRouter(prefix="/children", tags=["children"])


@router.post("/", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
def create_child_endpoint(
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un enfant pour l'utilisateur connecté"""
    return create_child(db, child_data, current_user.id)


@router.get("/", response_model=List[ChildResponse])
def get_my_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer tous les enfants de l'utilisateur connecté"""
    return get_children_by_parent(db, current_user.id)


@router.get("/{child_id}", response_model=ChildResponse)
def get_child_endpoint(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un enfant spécifique"""
    return get_child_by_id(db, child_id, current_user.id)


@router.put("/{child_id}", response_model=ChildResponse)
def update_child_endpoint(
    child_id: int,
    child_data: ChildUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifier un enfant"""
    return update_child(db, child_id, current_user.id, child_data)


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child_endpoint(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un enfant (et toutes ses locations)"""
    delete_child(db, child_id, current_user.id)
