from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(32), unique=True, index=True, nullable=False)
    
    # Updated location fields
    image_url = Column(String(255), nullable=True)
    location_name = Column(String(255), nullable=True)
    location_state = Column(String(100), nullable=True)
    location_district = Column(String(100), nullable=True)

    weather_alert = Column(Boolean, nullable=False, default=True)
    pest_alert = Column(Boolean, nullable=False, default=True)
    market_update = Column(Boolean, nullable=False, default=False)
    notification_alert = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to crops (one-to-many)
    crops = relationship("Crop", back_populates="user", cascade="all, delete-orphan")
    # Relationship to community posts (one-to-many)
    posts = relationship("CommunityPost", back_populates="user", cascade="all, delete-orphan")
