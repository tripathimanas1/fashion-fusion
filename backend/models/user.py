from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_designer = Column(Boolean, default=False)  # Added for designer role
    is_tailor = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Profile information
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(Text, nullable=True)  # Changed from address to location for consistency
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Tailor specific fields
    business_name = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    years_experience = Column(Integer, nullable=True)
    rating = Column(Float, default=0.0)
    profile_image_url = Column(String, nullable=True)
    
    # Relationships
    designs = relationship("Design", back_populates="user")
    saved_designs = relationship("SavedDesign", back_populates="user")
    orders = relationship("Order", foreign_keys="Order.user_id", back_populates="user")
    tailor_orders = relationship("Order", foreign_keys="Order.tailor_id", back_populates="tailor")
    boards = relationship("Board", back_populates="user")
    measurements = relationship("Measurement", back_populates="user")
    applications = relationship("TailorApplication", back_populates="user")
    tailor_profile = relationship("Tailor", back_populates="user")
