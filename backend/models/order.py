from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base

class OrderStatusEnum(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tailor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Order details
    order_number = Column(String, unique=True, nullable=False)
    status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.PENDING)
    total_amount = Column(Float, nullable=False)
    
    # Shipping information
    shipping_address = Column(Text, nullable=False)
    shipping_city = Column(String, nullable=False)
    shipping_country = Column(String, nullable=False)
    shipping_postal_code = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    
    # Timeline
    estimated_delivery = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Notes
    special_instructions = Column(Text, nullable=True)
    tailor_notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    tailor = relationship("User", back_populates="tailor_orders", foreign_keys=[tailor_id])
    order_items = relationship("OrderItem", back_populates="order")
    measurements = relationship("Measurement", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=False)
    
    # Item details
    quantity = Column(Integer, default=1)
    size = Column(String, nullable=False)
    color = Column(String, nullable=True)
    fabric_type = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    
    # Customization
    customizations = Column(JSON, nullable=True)  # Additional custom options
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    design = relationship("Design", back_populates="order_items")