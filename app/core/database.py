from sqlalchemy import create_engine  # Transform URL into Postgre connection
from sqlalchemy.ext.declarative import (  # import base Class
    declarative_base,
)
from sqlalchemy.orm import sessionmaker

""" build session for each http request"""
from app.core.config import settings

# Fix pour Fly.io qui injecte "postgres://" au lieu de "postgresql://"
db_url = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
