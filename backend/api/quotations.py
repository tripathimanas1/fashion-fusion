"""
Quotation API router — handles the full Buy → Quote → Accept flow.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from database import get_db
from models.quotation import QuotationRequest, TailorQuote, QuotationStatus, QuotationRequestStatus
from models.design import Design
from models.user import User
from models.order import Order, OrderItem, OrderStatusEnum

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateQuotationRequest(BaseModel):
    user_id:             int
    design_id:           int
    selected_image_url:  str

    # Measurements
    standard_size:       Optional[str]   = None
    chest:               Optional[float] = None
    waist:               Optional[float] = None
    hips:                Optional[float] = None
    height:              Optional[float] = None
    shoulder_width:      Optional[float] = None
    sleeve_length:       Optional[float] = None
    inseam:              Optional[float] = None

    # Material
    suggested_material:  Optional[str] = None
    preferred_material:  Optional[str] = None
    additional_notes:    Optional[str] = None

    # Shipping
    shipping_address:     Optional[str] = None
    shipping_city:        Optional[str] = None
    shipping_country:     Optional[str] = "India"
    shipping_postal_code: Optional[str] = None
    phone_number:         Optional[str] = None


class SubmitQuoteRequest(BaseModel):
    tailor_user_id:  int
    price:           float
    estimated_days:  Optional[int] = None
    notes:           Optional[str] = None


class AcceptQuoteRequest(BaseModel):
    user_id: int


# ── User endpoints ────────────────────────────────────────────────────────────

@router.post("/")
def create_quotation_request(body: CreateQuotationRequest, db: Session = Depends(get_db)):
    """User clicks Buy → creates a quotation request broadcast to all tailors."""
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    design = db.query(Design).filter(Design.id == body.design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    # Get material suggestion from design's fabric_recommendations
    suggested_material = None
    if design.fabric_recommendations:
        fabrics = design.fabric_recommendations
        if isinstance(fabrics, list) and fabrics:
            suggested_material = ", ".join(fabrics[:2])

    req = QuotationRequest(
        user_id=body.user_id,
        design_id=body.design_id,
        selected_image_url=body.selected_image_url,
        status=QuotationStatus.PENDING.value,
        suggested_material=suggested_material or body.suggested_material,
        preferred_material=body.preferred_material,
        standard_size=body.standard_size,
        chest=body.chest,
        waist=body.waist,
        hips=body.hips,
        height=body.height,
        shoulder_width=body.shoulder_width,
        sleeve_length=body.sleeve_length,
        inseam=body.inseam,
        additional_notes=body.additional_notes,
        shipping_address=body.shipping_address,
        shipping_city=body.shipping_city,
        shipping_country=body.shipping_country,
        shipping_postal_code=body.shipping_postal_code,
        phone_number=body.phone_number,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Count active tailors this was broadcast to
    tailor_count = db.query(User).filter(User.is_tailor == True, User.is_active == True).count()

    return {
        "message": "Quotation request sent to tailors",
        "request_id": req.id,
        "broadcast_to": tailor_count,
        "expires_at": req.expires_at.isoformat(),
        "suggested_material": req.suggested_material,
    }


@router.get("/user/{user_id}")
def get_user_quotations(user_id: int, db: Session = Depends(get_db)):
    """Get all quotation requests made by a user with their received quotes."""
    requests = (
        db.query(QuotationRequest)
        .filter(QuotationRequest.user_id == user_id)
        .order_by(QuotationRequest.created_at.desc())
        .all()
    )

    result = []
    for req in requests:
        design = req.design
        quotes = []
        for q in req.quotes:
            tailor = q.tailor
            quotes.append({
                "quote_id":       q.id,
                "tailor_id":      q.tailor_user_id,
                "tailor_name":    tailor.full_name or tailor.username if tailor else "Unknown",
                "tailor_rating":  getattr(tailor, "rating", 0.0) if tailor else 0.0,
                "price":          q.price,
                "estimated_days": q.estimated_days,
                "notes":          q.notes,
                "status":         q.status,
                "created_at":     q.created_at.isoformat(),
            })

        result.append({
            "request_id":        req.id,
            "status":            req.status,
            "design_id":         req.design_id,
            "design_title":      design.title if design else "",
            "selected_image_url": req.selected_image_url,
            "suggested_material": req.suggested_material,
            "preferred_material": req.preferred_material,
            "standard_size":     req.standard_size,
            "additional_notes":  req.additional_notes,
            "created_at":        req.created_at.isoformat(),
            "expires_at":        req.expires_at.isoformat() if req.expires_at else None,
            "quotes":            quotes,
            "quote_count":       len(quotes),
        })

    return result


@router.post("/{request_id}/accept/{quote_id}")
def accept_quote(request_id: int, quote_id: int, body: AcceptQuoteRequest, db: Session = Depends(get_db)):
    """User accepts a tailor's quote → creates a confirmed Order."""
    req = db.query(QuotationRequest).filter(
        QuotationRequest.id == request_id,
        QuotationRequest.user_id == body.user_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Quotation request not found")

    quote = db.query(TailorQuote).filter(
        TailorQuote.id == quote_id,
        TailorQuote.request_id == request_id
    ).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    import uuid
    order_number = f"FF-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

    order = Order(
        user_id=req.user_id,
        tailor_id=quote.tailor_user_id,
        order_number=order_number,
        status=OrderStatusEnum.CONFIRMED,
        total_amount=quote.price,
        shipping_address=req.shipping_address or "",
        shipping_city=req.shipping_city or "",
        shipping_country=req.shipping_country or "India",
        shipping_postal_code=req.shipping_postal_code or "",
        phone_number=req.phone_number or "",
        special_instructions=req.additional_notes,
    )
    db.add(order)
    db.flush()

    item = OrderItem(
        order_id=order.id,
        design_id=req.design_id,
        quantity=1,
        size=req.standard_size or "M",
        price=quote.price,
    )
    db.add(item)

    # Update statuses
    req.status = QuotationStatus.ACCEPTED.value
    quote.status = QuotationRequestStatus.ACCEPTED.value
    for q in req.quotes:
        if q.id != quote_id:
            q.status = QuotationRequestStatus.REJECTED.value

    db.commit()
    db.refresh(order)

    return {
        "message": "Order confirmed!",
        "order_id": order.id,
        "order_number": order.order_number,
        "tailor": quote.tailor.full_name or quote.tailor.username if quote.tailor else "Tailor",
        "total_amount": order.total_amount,
    }


# ── Tailor endpoints ──────────────────────────────────────────────────────────

@router.get("/tailor/{tailor_user_id}/pending")
def get_tailor_pending_requests(tailor_user_id: int, db: Session = Depends(get_db)):
    """Tailor sees all pending quotation requests they haven't responded to yet."""
    tailor = db.query(User).filter(User.id == tailor_user_id, User.is_tailor == True).first()
    if not tailor:
        raise HTTPException(status_code=404, detail="Tailor not found")

    # Get all pending requests the tailor hasn't quoted yet
    already_quoted = db.query(TailorQuote.request_id).filter(
        TailorQuote.tailor_user_id == tailor_user_id
    ).subquery()

    pending = (
        db.query(QuotationRequest)
        .filter(
            QuotationRequest.status == QuotationStatus.PENDING.value,
            ~QuotationRequest.id.in_(already_quoted)
        )
        .order_by(QuotationRequest.created_at.desc())
        .all()
    )

    result = []
    for req in pending:
        design = req.design
        urls = []
        if design and design.image_urls:
            urls = design.image_urls if isinstance(design.image_urls, list) else []

        result.append({
            "request_id":         req.id,
            "design_id":          req.design_id,
            "design_title":       design.title if design else "",
            "design_image_urls":  urls,
            "selected_image_url": req.selected_image_url,
            "standard_size":      req.standard_size,
            "chest":              req.chest,
            "waist":              req.waist,
            "hips":               req.hips,
            "height":             req.height,
            "shoulder_width":     req.shoulder_width,
            "sleeve_length":      req.sleeve_length,
            "inseam":             req.inseam,
            "suggested_material": req.suggested_material,
            "preferred_material": req.preferred_material,
            "additional_notes":   req.additional_notes,
            "created_at":         req.created_at.isoformat(),
            "expires_at":         req.expires_at.isoformat() if req.expires_at else None,
        })

    return result


@router.post("/{request_id}/quote")
def submit_quote(request_id: int, body: SubmitQuoteRequest, db: Session = Depends(get_db)):
    """Tailor submits a price quote for a quotation request."""
    req = db.query(QuotationRequest).filter(QuotationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status == QuotationStatus.ACCEPTED.value:
        raise HTTPException(status_code=400, detail="This request has already been accepted")

    # Check tailor hasn't already quoted
    existing = db.query(TailorQuote).filter(
        TailorQuote.request_id == request_id,
        TailorQuote.tailor_user_id == body.tailor_user_id
    ).first()
    if existing:
        # Update existing quote
        existing.price = body.price
        existing.estimated_days = body.estimated_days
        existing.notes = body.notes
        db.commit()
        return {"message": "Quote updated", "quote_id": existing.id}

    quote = TailorQuote(
        request_id=request_id,
        tailor_user_id=body.tailor_user_id,
        price=body.price,
        estimated_days=body.estimated_days,
        notes=body.notes,
        status=QuotationRequestStatus.QUOTED.value,
    )
    db.add(quote)

    # Update request status
    req.status = QuotationStatus.QUOTED.value
    db.commit()
    db.refresh(quote)

    return {"message": "Quote submitted successfully", "quote_id": quote.id}