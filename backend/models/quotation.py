"""
Quotation model — the core of the marketplace order flow.

Flow:
  1. User submits QuotationRequest (design + measurements)
  2. System broadcasts to all active tailors
  3. Each tailor sees pending requests, submits a Quotation (price + notes)
  4. User sees all quotes on Track Orders page
  5. User accepts one quote → creates confirmed Order
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base


class QuotationStatus(enum.Enum):
    PENDING   = "pending"    # waiting for tailor quotes
    QUOTED    = "quoted"     # at least one tailor has quoted
    ACCEPTED  = "accepted"   # user accepted a quote → becomes Order
    EXPIRED   = "expired"    # no quotes received in time
    CANCELLED = "cancelled"


class QuotationRequestStatus(enum.Enum):
    PENDING   = "pending"    # tailor hasn't responded yet
    QUOTED    = "quoted"     # tailor submitted a price
    REJECTED  = "rejected"   # tailor declined
    ACCEPTED  = "accepted"   # user chose this tailor


class QuotationRequest(Base):
    """
    Created when a user clicks Buy on a design image.
    Broadcasted to all active tailors.
    """
    __tablename__ = "quotation_requests"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id"), nullable=False)
    design_id            = Column(Integer, ForeignKey("designs.id"), nullable=False)
    selected_image_url   = Column(String, nullable=False)   # which image they want made
    status               = Column(String, default=QuotationStatus.PENDING.value)

    # Measurements
    standard_size        = Column(String, nullable=True)    # XS/S/M/L/XL/XXL
    chest                = Column(Float, nullable=True)
    waist                = Column(Float, nullable=True)
    hips                 = Column(Float, nullable=True)
    height               = Column(Float, nullable=True)
    shoulder_width       = Column(Float, nullable=True)
    sleeve_length        = Column(Float, nullable=True)
    inseam               = Column(Float, nullable=True)

    # Material / notes
    suggested_material   = Column(String, nullable=True)    # from AI recommendation
    preferred_material   = Column(String, nullable=True)    # user override
    additional_notes     = Column(Text, nullable=True)

    # Shipping
    shipping_address     = Column(Text, nullable=True)
    shipping_city        = Column(String, nullable=True)
    shipping_country     = Column(String, nullable=True)
    shipping_postal_code = Column(String, nullable=True)
    phone_number         = Column(String, nullable=True)

    created_at           = Column(DateTime, default=datetime.utcnow)
    expires_at           = Column(DateTime, nullable=True)

    # Relationships
    user    = relationship("User", foreign_keys=[user_id])
    design  = relationship("Design")
    quotes  = relationship("TailorQuote", back_populates="request", cascade="all, delete-orphan")


class TailorQuote(Base):
    """
    A tailor's response to a QuotationRequest.
    Multiple tailors can quote on the same request.
    """
    __tablename__ = "tailor_quotes"

    id                   = Column(Integer, primary_key=True, index=True)
    request_id           = Column(Integer, ForeignKey("quotation_requests.id"), nullable=False)
    tailor_user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)  # tailor's user id

    price                = Column(Float, nullable=False)
    estimated_days       = Column(Integer, nullable=True)   # delivery time estimate
    notes                = Column(Text, nullable=True)       # tailor's message to user
    status               = Column(String, default=QuotationRequestStatus.QUOTED.value)

    created_at           = Column(DateTime, default=datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    request = relationship("QuotationRequest", back_populates="quotes")
    tailor  = relationship("User", foreign_keys=[tailor_user_id])