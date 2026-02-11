"""
Configuration pytest - Fixtures communes pour tous les tests
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.child import Child
from app.core.security import hash_password

# Base de données de test en mémoire (SQLite)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Crée une DB de test fraîche pour chaque test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db):
    """Crée un user de test"""
    user = User(
        email="test@test.com",
        username="testuser",
        hashed_password=hash_password("password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_child(db, test_user):
    """Crée un enfant de test"""
    child = Child(
        name="Test Child",
        parent_id=test_user.id
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return child
