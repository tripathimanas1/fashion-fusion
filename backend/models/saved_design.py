from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from models.base import Base
from datetime import datetime

class SavedDesign(Base):
    __tablename__ = "saved_designs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=False)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=True)
    saved_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="saved_designs")
    design = relationship("Design", back_populates="saved_designs")
    board = relationship("Board", back_populates="saved_designs")
    
    def __repr__(self):
        return f"<SavedDesign(id={self.id}, user_id={self.user_id}, design_id={self.design_id})>"