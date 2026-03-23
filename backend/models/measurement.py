from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base
from datetime import datetime

class Measurement(Base):
    __tablename__ = "measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    chest = Column(Float, nullable=True)
    waist = Column(Float, nullable=True)
    hips = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    shoulder_width = Column(Float, nullable=True)
    sleeve_length = Column(Float, nullable=True)
    inseam = Column(Float, nullable=True)
    neck_circumference = Column(Float, nullable=True)

    # Fit preferences (merged from order.py version)
    fit_preference = Column(String, nullable=True)   # "slim", "regular", "loose"
    preferred_length = Column(String, nullable=True) # "short", "regular", "long"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="measurements")
    order = relationship("Order", back_populates="measurements")
    
    def __repr__(self):
        return f"<Measurement(id={self.id}, user_id={self.user_id})>"