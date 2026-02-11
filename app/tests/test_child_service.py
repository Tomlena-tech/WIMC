"""
Tests pour child_service.py
"""
import pytest
from fastapi import HTTPException
from app.services.child_service import (
    create_child,
    get_children_by_parent,
    get_child_by_id,
    update_child,
    delete_child
)
from app.schemas.child import ChildCreate, ChildUpdate


def test_create_child(db, test_user):
    """Test : Création d'un enfant"""
    child_data = ChildCreate(name="New Child")
    child = create_child(db, child_data, test_user.id)
    
    assert child.name == "New Child"
    assert child.parent_id == test_user.id
    assert child.id is not None


def test_get_children_by_parent(db, test_user, test_child):
    """Test : Récupération des enfants d'un parent"""
    children = get_children_by_parent(db, test_user.id)
    
    assert len(children) == 1
    assert children[0].id == test_child.id


def test_get_child_by_id_success(db, test_user, test_child):
    """Test : Récupération d'un enfant par ID (propriétaire OK)"""
    child = get_child_by_id(db, test_child.id, test_user.id)
    
    assert child.id == test_child.id
    assert child.name == test_child.name


def test_get_child_by_id_wrong_parent(db, test_user, test_child):
    """Test : Récupération avec mauvais parent_id → erreur 404"""
    wrong_parent_id = 999
    
    with pytest.raises(HTTPException) as exc_info:
        get_child_by_id(db, test_child.id, wrong_parent_id)
    
    assert exc_info.value.status_code == 404


def test_update_child(db, test_user, test_child):
    """Test : Modification d'un enfant"""
    update_data = ChildUpdate(name="Updated Child")
    updated_child = update_child(db, test_child.id, test_user.id, update_data)
    
    assert updated_child.name == "Updated Child"
    assert updated_child.id == test_child.id


def test_delete_child(db, test_user, test_child):
    """Test : Suppression d'un enfant"""
    delete_child(db, test_child.id, test_user.id)
    
    # Vérifier que l'enfant n'existe plus
    with pytest.raises(HTTPException):
        get_child_by_id(db, test_child.id, test_user.id)
