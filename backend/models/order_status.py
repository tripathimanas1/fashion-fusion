from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from models.base import Base
from datetime import datetime

class OrderStatusModel(Base):
    """Lookup table for order status definitions. Named OrderStatusModel to avoid
    collision with the OrderStatusEnum in order.py."""
    __tablename__ = "order_status"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<OrderStatusModel(id={self.id}, name={self.name})>"