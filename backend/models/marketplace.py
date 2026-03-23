from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from models.base import Base
from datetime import datetime

class Marketplace(Base):
    __tablename__ = "marketplace"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Marketplace(id={self.id}, name={self.name})>"

class TailorApplication(Base):
    __tablename__ = "tailor_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tailor_id = Column(Integer, ForeignKey("tailors.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="applications")
    tailor = relationship("Tailor", back_populates="applications")
    
    def __repr__(self):
        return f"<TailorApplication(id={self.id}, user_id={self.user_id}, tailor_id={self.tailor_id})>"
