import json

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator
from models.base import Base


class JSONText(TypeDecorator):
    """Store Python lists/dicts in a TEXT column for SQLite compatibility."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, (list, dict)):
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        try:
            return json.loads(value)
        except (TypeError, ValueError):
            return value

class Tailor(Base):
    __tablename__ = "tailors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Business Information
    business_name = Column(String(255), nullable=False)
    business_type = Column(String(50), default="tailor")  # "tailor", "designer", "both"
    business_address = Column(String(500), nullable=False)
    business_phone = Column(String(20), nullable=False)
    business_email = Column(String(255), nullable=False)
    
    # Professional Details
    specialties = Column(JSONText, default=list)
    experience_years = Column(Integer, default=0)
    description = Column(Text)
    
    # Services and Pricing
    services_offered = Column(JSONText)
    price_range_min = Column(Float)
    price_range_max = Column(Float)
    
    # Portfolio and Media
    portfolio_images = Column(JSONText)
    bio = Column(Text)
    
    # Location and Availability
    location = Column(String(255))
    service_radius_km = Column(Integer, default=50)  # Service area radius
    is_available = Column(Boolean, default=True)
    
    # Verification and Ratings
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Business Metrics
    total_orders = Column(Integer, default=0)
    completed_orders = Column(Integer, default=0)
    average_response_time = Column(Float, default=0.0)  # in hours
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tailor_profile")
    applications = relationship("TailorApplication", back_populates="tailor")

    @property
    def active_orders_count(self):
        """Count of currently active orders"""
        if not self.user:
            return 0
        return len([order for order in self.user.tailor_orders 
                   if order.status in ['ORDER_ACTIVE', 'IN_PROGRESS']])

    @property
    def pending_quotes_count(self):
        """Count of orders awaiting quote"""
        if not self.user:
            return 0
        return len([order for order in self.user.tailor_orders 
                   if order.status == 'PENDING_QUOTE'])

    @property
    def completion_rate(self):
        """Order completion rate percentage"""
        if self.total_orders == 0:
            return 0.0
        return (self.completed_orders / self.total_orders) * 100
