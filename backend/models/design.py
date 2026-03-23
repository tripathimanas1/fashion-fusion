from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class Design(Base):
    __tablename__ = "designs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=True)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    prompt = Column(Text, nullable=False)
    
    # Generation parameters
    generation_type = Column(String, nullable=False)  # "prompt", "image", "sketch"
    reference_image_url = Column(String, nullable=True)
    
    # Generated images
    image_urls = Column(JSON, nullable=False)  # List of generated image URLs
    
    # AI analysis results
    color_palette = Column(JSON, nullable=True)  # Extracted color palette
    style_recommendations = Column(JSON, nullable=True)  # AI style suggestions
    fabric_recommendations = Column(JSON, nullable=True)  # Suggested fabrics
    
    # Metadata
    is_public = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="designs")
    saved_designs = relationship("SavedDesign", back_populates="design")
    board = relationship("Board", back_populates="designs")
    order_items = relationship("OrderItem", back_populates="design")