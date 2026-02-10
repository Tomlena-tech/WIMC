from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    birth_date = Column(Date, nullable=True)
    phone = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    battery = Column(Integer, default=100)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    last_update = Column(DateTime, nullable=True)

    # Relations
    parent = relationship("User", back_populates="children")
    locations = relationship("Location", back_populates="child", cascade="all, delete-orphan")
