from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from database import get_db
from models.order import Order, OrderItem, OrderStatusEnum
from models.user import User

router = APIRouter()


class PlaceOrderRequest(BaseModel):
    user_id: int
    tailor_id: int          # user_id of the tailor
    design_id: int
    quantity: int = 1
    size: str
    color: Optional[str] = None
    fabric_type: Optional[str] = None
    price: float
    shipping_address: str
    shipping_city: str
    shipping_country: str
    shipping_postal_code: str
    phone_number: str
    special_instructions: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: str
    total_amount: float
    created_at: str
    shipping_city: str
    shipping_country: str

    class Config:
        from_attributes = True


@router.post("/", response_model=dict)
async def place_order(body: PlaceOrderRequest, db: Session = Depends(get_db)):
    """Place a new order with a tailor for a design."""
    try:
        # Verify user and tailor exist
        user = db.query(User).filter(User.id == body.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        tailor = db.query(User).filter(User.id == body.tailor_id, User.is_tailor == True).first()
        if not tailor:
            raise HTTPException(status_code=404, detail="Tailor not found")

        order_number = f"FF-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

        order = Order(
            user_id=body.user_id,
            tailor_id=body.tailor_id,
            order_number=order_number,
            status=OrderStatusEnum.PENDING,
            total_amount=body.price * body.quantity,
            shipping_address=body.shipping_address,
            shipping_city=body.shipping_city,
            shipping_country=body.shipping_country,
            shipping_postal_code=body.shipping_postal_code,
            phone_number=body.phone_number,
            special_instructions=body.special_instructions,
        )
        db.add(order)
        db.flush()  # get order.id before committing

        item = OrderItem(
            order_id=order.id,
            design_id=body.design_id,
            quantity=body.quantity,
            size=body.size,
            color=body.color,
            fabric_type=body.fabric_type,
            price=body.price,
        )
        db.add(item)
        db.commit()
        db.refresh(order)

        return {
            "message": "Order placed successfully",
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.status.value,
            "total_amount": order.total_amount,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to place order: {str(e)}")


@router.get("/user/{user_id}")
async def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    """Get all orders placed by a user."""
    try:
        orders = (db.query(Order)
                  .filter(Order.user_id == user_id)
                  .order_by(Order.created_at.desc())
                  .all())
        return [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status.value if o.status else "pending",
                "total_amount": o.total_amount,
                "shipping_city": o.shipping_city,
                "shipping_country": o.shipping_country,
                "created_at": o.created_at.isoformat() if o.created_at else "",
            }
            for o in orders
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{order_id}")
async def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get a specific order by ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status.value if order.status else "pending",
        "total_amount": order.total_amount,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "shipping_country": order.shipping_country,
        "shipping_postal_code": order.shipping_postal_code,
        "phone_number": order.phone_number,
        "special_instructions": order.special_instructions,
        "created_at": order.created_at.isoformat() if order.created_at else "",
        "items": [
            {
                "id": item.id,
                "design_id": item.design_id,
                "quantity": item.quantity,
                "size": item.size,
                "price": item.price,
            }
            for item in order.order_items
        ],
    }