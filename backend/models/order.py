from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum, JSON, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base

class OrderStatusEnum(enum.Enum):
    PENDING_QUOTE = "pending_quote"        # User placed order, awaiting quote
    QUOTE_READY = "quote_ready"            # Tailor sent quote, awaiting user confirmation
    QUOTE_REJECTED = "quote_rejected"      # User rejected quote
    ORDER_ACTIVE = "order_active"          # User accepted quote, order is active
    IN_PROGRESS = "in_progress"            # Tailor is working on order
    READY = "ready"                        # Order completed, ready for delivery
    DELIVERED = "delivered"                # Order delivered to user
    CANCELLED = "cancelled"                # Order cancelled

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tailor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL until quote accepted
    
    # Order details
    order_number = Column(String, unique=True, nullable=False)
    status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.PENDING_QUOTE)
    
    # Design and Requirements
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    design_image_url = Column(String(500))  # Reference design image
    measurements = Column(JSON)  # Measurement data
    special_requirements = Column(Text)
    
    # Quote Information
    quote_price = Column(Float)  # Total quoted price
    quote_description = Column(Text)  # Detailed quote breakdown
    quote_timeline = Column(String(255))  # Estimated completion time
    quote_created_at = Column(DateTime)
    quote_expires_at = Column(DateTime)
    quote_accepted_at = Column(DateTime)
    
    # Pricing Breakdown
    base_price = Column(Float)
    materials_cost = Column(Float)
    labor_cost = Column(Float)
    total_amount = Column(Float)  # Final accepted price
    
    # Payments
    deposit_amount = Column(Float)
    deposit_paid = Column(Boolean, default=False)
    final_payment_paid = Column(Boolean, default=False)
    
    # Timeline
    requested_deadline = Column(DateTime)
    estimated_completion = Column(DateTime)
    actual_completion = Column(DateTime)
    
    # Progress Tracking
    progress_updates = Column(JSON)  # Array of progress updates with images
    current_stage = Column(String(50), default="pending")
    completion_percentage = Column(Integer, default=0)
    
    # Communication
    last_message_at = Column(DateTime)
    unread_user_messages = Column(Integer, default=0)
    unread_tailor_messages = Column(Integer, default=0)
    
    # Shipping information (for final delivery)
    shipping_address = Column(Text)
    shipping_city = Column(String)
    shipping_country = Column(String)
    shipping_postal_code = Column(String)
    phone_number = Column(String)
    
    # Review and Rating
    user_rating = Column(Integer)  # 1-5 stars
    user_review = Column(Text)
    tailor_response = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    tailor = relationship("User", back_populates="tailor_orders", foreign_keys=[tailor_id])
    order_items = relationship("OrderItem", back_populates="order")
    measurements_rel = relationship("Measurement", back_populates="order")
    messages = relationship("OrderMessage", back_populates="order")

    @property
    def is_pending_quote(self):
        return self.status == OrderStatusEnum.PENDING_QUOTE
    
    @property
    def is_quote_ready(self):
        return self.status == OrderStatusEnum.QUOTE_READY
    
    @property
    def is_active(self):
        return self.status in [OrderStatusEnum.ORDER_ACTIVE, OrderStatusEnum.IN_PROGRESS]
    
    @property
    def is_completed(self):
        return self.status in [OrderStatusEnum.READY, OrderStatusEnum.DELIVERED]
    
    @property
    def days_until_deadline(self):
        if not self.requested_deadline:
            return None
        now = datetime.utcnow()
        deadline = self.requested_deadline
        if deadline > now:
            return (deadline - now).days
        return 0

class OrderMessage(Base):
    __tablename__ = "order_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Message content
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, image, file
    
    # Attachments
    file_url = Column(String(500))
    file_name = Column(String(255))
    file_type = Column(String(50))
    
    # Read status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="messages")
    sender = relationship("User")

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