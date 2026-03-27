from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, List, Optional
from datetime import datetime, timedelta
import json

from database import get_db
from models.user import User
from models.tailor import Tailor
from models.order import Order, OrderStatusEnum, OrderMessage
from models.design import Design
from api.auth import get_current_user

router = APIRouter(tags=["tailor"])


def normalize_string_list(value) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def get_or_create_tailor_profile(db: Session, current_user: User) -> Tailor:
    tailor = db.query(Tailor).filter(Tailor.user_id == current_user.id).first()
    if tailor:
        return tailor

    tailor = Tailor(
        user_id=current_user.id,
        business_name=current_user.business_name or current_user.full_name or current_user.username,
        business_type="tailor",
        business_address=current_user.location or "Not provided",
        business_phone=current_user.phone or "Not provided",
        business_email=current_user.email,
        specialties=[],
        experience_years=current_user.years_experience or 0,
        description=current_user.bio,
        bio=current_user.bio,
        location=current_user.location,
    )
    db.add(tailor)
    db.commit()
    db.refresh(tailor)
    return tailor

# Dependencies
async def get_current_tailor(current_user: User = Depends(get_current_user)):
    """Ensure current user is a tailor"""
    if not current_user.is_tailor:
        raise HTTPException(
            status_code=403, 
            detail="Access denied. User is not a tailor."
        )
    return current_user

# Pydantic Models
class TailorProfileResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    business_type: str
    business_address: str
    business_phone: str
    business_email: str
    specialties: List[str]
    experience_years: int
    description: Optional[str]
    rating: float
    total_reviews: int
    total_orders: int
    completed_orders: int
    is_verified: bool
    is_available: bool
    location: Optional[str]
    service_radius_km: int
    
    # Computed fields
    active_orders_count: int
    pending_quotes_count: int
    completion_rate: float

class OrderResponse(BaseModel):
    id: int
    order_number: str
    title: str
    description: str
    status: str
    design_image_url: Optional[str]
    quote_price: Optional[float]
    quote_description: Optional[str]
    quote_timeline: Optional[str]
    quote_expires_at: Optional[datetime]
    requested_deadline: Optional[datetime]
    completion_percentage: int
    current_stage: str
    created_at: datetime
    
    # User info
    user_name: str
    user_email: str
    user_phone: Optional[str]
    shipping_address: Optional[str]
    shipping_city: Optional[str]
    shipping_country: Optional[str]
    shipping_postal_code: Optional[str]
    phone_number: Optional[str]
    measurements: Optional[dict]
    special_requirements: Optional[str]
    color_palette: List[dict]
    fabric_recommendations: List[str]
    order_items: List[dict[str, Any]]

class QuoteRequest(BaseModel):
    quote_price: float
    base_price: float
    materials_cost: float
    labor_cost: float
    quote_description: str
    quote_timeline: str
    quote_valid_hours: int = 72  # Quote expires after 72 hours

class OrderUpdateRequest(BaseModel):
    status: Optional[str]
    progress_percentage: Optional[int]
    current_stage: Optional[str]
    progress_note: Optional[str]
    progress_image_url: Optional[str]

class MessageRequest(BaseModel):
    message: str
    message_type: str = "text"


def build_order_response(order: Order) -> OrderResponse:
    primary_design = order.order_items[0].design if order.order_items else None
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        title=order.title,
        description=order.description,
        status=order.status.value,
        design_image_url=order.design_image_url,
        quote_price=order.quote_price,
        quote_description=order.quote_description,
        quote_timeline=order.quote_timeline,
        quote_expires_at=order.quote_expires_at,
        requested_deadline=order.requested_deadline,
        completion_percentage=order.completion_percentage,
        current_stage=order.current_stage,
        created_at=order.created_at,
        user_name=order.user.full_name,
        user_email=order.user.email,
        user_phone=order.user.phone,
        shipping_address=order.shipping_address,
        shipping_city=order.shipping_city,
        shipping_country=order.shipping_country,
        shipping_postal_code=order.shipping_postal_code,
        phone_number=order.phone_number,
        measurements=order.measurements or {},
        special_requirements=order.special_requirements,
        color_palette=primary_design.color_palette if primary_design and primary_design.color_palette else [],
        fabric_recommendations=primary_design.fabric_recommendations if primary_design and primary_design.fabric_recommendations else [],
        order_items=[
            {
                "id": item.id,
                "design_id": item.design_id,
                "quantity": item.quantity,
                "size": item.size,
                "color": item.color,
                "fabric_type": item.fabric_type,
                "price": item.price,
                "customizations": item.customizations or {},
            }
            for item in order.order_items
        ],
    )

# ── Tailor Profile ────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=TailorProfileResponse)
async def get_tailor_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_tailor)):
    """Get current tailor's profile"""
    tailor = get_or_create_tailor_profile(db, current_user)
    
    return TailorProfileResponse(
        id=tailor.id,
        user_id=tailor.user_id,
        business_name=tailor.business_name,
        business_type=tailor.business_type,
        business_address=tailor.business_address,
        business_phone=tailor.business_phone,
        business_email=tailor.business_email,
        specialties=normalize_string_list(tailor.specialties),
        experience_years=tailor.experience_years,
        description=tailor.description,
        rating=tailor.rating,
        total_reviews=tailor.total_reviews,
        total_orders=tailor.total_orders,
        completed_orders=tailor.completed_orders,
        is_verified=tailor.is_verified,
        is_available=tailor.is_available,
        location=tailor.location,
        service_radius_km=tailor.service_radius_km,
        active_orders_count=tailor.active_orders_count,
        pending_quotes_count=tailor.pending_quotes_count,
        completion_rate=tailor.completion_rate
    )

@router.put("/profile")
async def update_tailor_profile(
    profile_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Update tailor profile"""
    tailor = get_or_create_tailor_profile(db, current_user)
    
    # Update allowed fields
    allowed_fields = [
        'business_name', 'business_type', 'business_address', 'business_phone',
        'business_email', 'specialties', 'experience_years', 'description',
        'services_offered', 'price_range_min', 'price_range_max', 'location',
        'service_radius_km', 'is_available'
    ]
    
    for field, value in profile_data.items():
        if field in allowed_fields and hasattr(tailor, field):
            if field == 'specialties' and isinstance(value, str):
                # Convert comma-separated string to array
                tailor.specialties = [s.strip() for s in value.split(',') if s.strip()]
            else:
                setattr(tailor, field, value)
    
    db.commit()
    return {"message": "Profile updated successfully"}

# ── Order Management ───────────────────────────────────────────────────────────────

@router.get("/orders", response_model=List[OrderResponse])
async def get_tailor_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Get tailor's orders with optional status filter"""
    query = db.query(Order).filter(Order.tailor_id == current_user.id)
    
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for order in orders:
        result.append(build_order_response(order))
    
    return result

@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Get detailed order information"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.tailor_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return build_order_response(order)

@router.post("/orders/{order_id}/quote")
async def create_quote(
    order_id: int,
    quote_data: QuoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Create or update quote for an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.status == OrderStatusEnum.PENDING_QUOTE
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not in pending quote status")
    
    # Update order with quote information
    order.tailor_id = current_user.id
    order.quote_price = quote_data.quote_price
    order.base_price = quote_data.base_price
    order.materials_cost = quote_data.materials_cost
    order.labor_cost = quote_data.labor_cost
    order.total_amount = quote_data.quote_price
    order.quote_description = quote_data.quote_description
    order.quote_timeline = quote_data.quote_timeline
    order.quote_created_at = datetime.utcnow()
    order.quote_expires_at = datetime.utcnow() + timedelta(hours=quote_data.quote_valid_hours)
    order.status = OrderStatusEnum.QUOTE_READY
    
    db.commit()
    
    # Update tailor metrics
    tailor = db.query(Tailor).filter(Tailor.user_id == current_user.id).first()
    if tailor:
        tailor.total_orders += 1
    
    return {"message": "Quote created successfully", "quote_expires_at": order.quote_expires_at}

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    update_data: OrderUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Update order status and progress"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.tailor_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update status if provided
    if update_data.status:
        try:
            new_status = OrderStatusEnum(update_data.status)
            order.status = new_status
            
            # Update completion based on status
            if new_status == OrderStatusEnum.IN_PROGRESS:
                order.completion_percentage = 25
            elif new_status == OrderStatusEnum.READY:
                order.completion_percentage = 100
                order.actual_completion = datetime.utcnow()
                
                # Update tailor metrics
                tailor = db.query(Tailor).filter(Tailor.user_id == current_user.id).first()
                if tailor:
                    tailor.completed_orders += 1
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    # Update progress information
    if update_data.progress_percentage is not None:
        order.completion_percentage = update_data.progress_percentage
    
    if update_data.current_stage:
        order.current_stage = update_data.current_stage
    
    # Add progress update if provided
    if update_data.progress_note or update_data.progress_image_url:
        progress_update = {
            "note": update_data.progress_note,
            "image_url": update_data.progress_image_url,
            "timestamp": datetime.utcnow().isoformat(),
            "stage": order.current_stage
        }
        
        if order.progress_updates:
            updates = json.loads(order.progress_updates)
            updates.append(progress_update)
            order.progress_updates = json.dumps(updates)
        else:
            order.progress_updates = json.dumps([progress_update])
    
    db.commit()
    
    return {"message": "Order updated successfully"}

# ── Messages ───────────────────────────────────────────────────────────────────────

@router.get("/orders/{order_id}/messages")
async def get_order_messages(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Get messages for an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.tailor_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    messages = db.query(OrderMessage).filter(
        OrderMessage.order_id == order_id
    ).order_by(OrderMessage.created_at.asc()).all()
    
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": msg.sender.full_name,
            "message": msg.message,
            "message_type": msg.message_type,
            "file_url": msg.file_url,
            "file_name": msg.file_name,
            "is_read": msg.is_read,
            "created_at": msg.created_at
        })
    
    return result

@router.post("/orders/{order_id}/messages")
async def send_message(
    order_id: int,
    message_data: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Send message for an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.tailor_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    message = OrderMessage(
        order_id=order_id,
        sender_id=current_user.id,
        message=message_data.message,
        message_type=message_data.message_type
    )
    
    db.add(message)
    
    # Update order message timestamp
    order.last_message_at = datetime.utcnow()
    order.unread_user_messages += 1
    
    db.commit()
    
    return {"message": "Message sent successfully"}

# ── Analytics ───────────────────────────────────────────────────────────────────────

@router.get("/analytics")
async def get_tailor_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tailor)
):
    """Get tailor analytics and dashboard data"""
    tailor = get_or_create_tailor_profile(db, current_user)
    
    # Get order statistics
    orders = db.query(Order).filter(Order.tailor_id == current_user.id).all()
    
    # Calculate metrics
    completed_orders = [order for order in orders if order.is_completed]
    total_revenue = sum(order.total_amount or 0 for order in completed_orders)
    monthly_revenue = sum(
        order.total_amount or 0 for order in orders 
        if order.is_completed and order.created_at.month == datetime.utcnow().month
    )
    
    # Status breakdown
    status_counts = {}
    for status in OrderStatusEnum:
        status_counts[status.value] = len([o for o in orders if o.status == status])
    
    return {
        "total_orders": len(orders),
        "completed_orders": len(completed_orders),
        "active_orders": len([o for o in orders if o.is_active]),
        "pending_quotes": len([o for o in orders if o.is_pending_quote]),
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "average_order_value": total_revenue / len(completed_orders) if completed_orders else 0,
        "completion_rate": tailor.completion_rate,
        "rating": tailor.rating,
        "status_breakdown": status_counts
    }
