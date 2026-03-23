from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from models.base import Base

class Tailor(Base):
    __tablename__ = "tailors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String(255), nullable=False)
    specialization = Column(String(100), nullable=False)  # e.g., "formal", "casual", "traditional"
    description = Column(Text)
    rating = Column(Float, default=0.0)
    location = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255), unique=True, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    experience_years = Column(Integer, default=0)
    price_range_min = Column(Float)
    price_range_max = Column(Float)
    portfolio_images = Column(Text)  # JSON string of image URLs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tailor_profile")
    applications = relationship("TailorApplication", back_populates="tailor")

    @property
    def orders(self):
        """Orders fulfilled by this tailor.
        Delegates to user.tailor_orders because orders.tailor_id is a FK
        to users(id), not tailors(id) — there is no direct FK to this table."""
        return self.user.tailor_orders if self.user else []