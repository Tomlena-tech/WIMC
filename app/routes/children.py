from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildResponse, ChildUpdate

router = APIRouter(prefix="/children", tags=["children"])


@router.post("/", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
def create_child(
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un enfant pour l'utilisateur connecté"""
    child = Child(**child_data.dict(), parent_id=current_user.id)
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


@router.get("/", response_model=List[ChildResponse])
def get_my_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer tous les enfants de l'utilisateur connecté"""
    children = db.query(Child).filter(Child.parent_id == current_user.id).all()
    return children


@router.get("/{child_id}", response_model=ChildResponse)
def get_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un enfant spécifique"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return child


@router.put("/{child_id}", response_model=ChildResponse)
def update_child(
    child_id: int,
    child_data: ChildUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifier un enfant"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    for key, value in child_data.dict(exclude_unset=True).items():
        setattr(child, key, value)
    
    db.commit()
    db.refresh(child)
    return child


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un enfant (et toutes ses locations)"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    db.delete(child)
    db.commit()
