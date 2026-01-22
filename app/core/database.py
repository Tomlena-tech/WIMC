from sqlalchemy import create_engine  # Transform URL into Postgre connection
from sqlalchemy.ext.declarative import (  # import base Class
    declarative_base,
)
from sqlalchemy.orm import sessionmaker

""" build session for each http request"""
from app.core.config import settings
engine = create_engine(settings.DATABASE_URL)  # connection engine
SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)  # automatic mode off for speed and security
Base = declarative_base()


def get_db():

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
