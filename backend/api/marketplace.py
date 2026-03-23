from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models.marketplace import Marketplace, TailorApplication
from models.tailor import Tailor
from models.user import User
from models.design import Design
import math

router = APIRouter()

class TailorProfile(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    specialization: str
    rating: float
    experience_years: int
    bio: Optional[str] = None
    is_available: bool = True
    distance_km: Optional[float] = None

class MarketplaceResponse(BaseModel):
    id: int
    name: str
    description: str
    image_url: str
    is_active: bool

@router.get("/tailors", response_model=List[TailorProfile])
async def get_nearby_tailors(
    latitude: float = Query(..., description="User latitude"),
    longitude: float = Query(..., description="User longitude"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    db: Session = Depends(get_db)
):
    """Get nearby tailors based on user location"""
    try:
        # Get all tailors
        tailors = db.query(Tailor).filter(Tailor.is_active == True).all()
        
        # Calculate distances (simplified - in production, use user's actual location)
        nearby_tailors = []
        for tailor in tailors:
            # For demo, use random coordinates - in production, geocode tailor location
            tailor_lat, tailor_lon = 40.7128, 74.0060  # NYC coordinates as fallback
            
            # Calculate distance using Haversine formula
            # Haversine formula — no external dependency
            R = 6371
            phi1, phi2 = math.radians(latitude), math.radians(tailor_lat)
            dphi    = math.radians(tailor_lat - latitude)
            dlambda = math.radians(tailor_lon - longitude)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
            distance = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            
            if distance <= radius_km:
                tailor_profile = TailorProfile(
                    id=tailor.id,
                    name=tailor.business_name,
                    email=tailor.email,
                    phone=tailor.phone,
                    location=tailor.location,
                    specialization=tailor.specialization,
                    rating=tailor.rating,
                    experience_years=tailor.experience_years,
                    bio=tailor.description,
                    is_available=tailor.is_active,
                    distance_km=round(distance, 2)
                )
                nearby_tailors.append(tailor_profile)
        
        # Sort by distance
        nearby_tailors.sort(key=lambda x: x.distance_km or float('inf'))
        
        return nearby_tailors[:10]  # Return max 10 tailors
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tailors: {str(e)}")

@router.get("/marketplaces", response_model=List[MarketplaceResponse])
async def get_marketplaces(db: Session = Depends(get_db)):
    """Get all active marketplaces"""
    try:
        marketplaces = db.query(Marketplace).filter(Marketplace.is_active == True).all()
        
        return [
            MarketplaceResponse(
                id=mp.id,
                name=mp.name,
                description=mp.description,
                image_url=mp.image_url,
                is_active=mp.is_active
            )
            for mp in marketplaces
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get marketplaces: {str(e)}")

@router.post("/tailors/{tailor_id}/contact")
async def contact_tailor(
    tailor_id: int,
    body: dict,
    db: Session = Depends(get_db)
):
    """Contact a tailor for custom order"""
    try:
        # Create tailor application
        application = TailorApplication(
            user_id=body.get("user_id", 0),
            tailor_id=tailor_id,
            status="pending",
            message=body.get("message", "")
        )
        
        db.add(application)
        db.commit()
        
        return {"message": "Tailor contact request sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to contact tailor: {str(e)}")

@router.get("/designs/featured", response_model=List[dict])
async def get_featured_designs(db: Session = Depends(get_db)):
    """Get featured designs from marketplace"""
    try:
        # Get recent designs with high ratings
        featured_designs = db.query(Design).limit(20).all()
        
        return [
            {
                "design_id": design.id,
                "image_url": design.image_urls[0] if design.image_urls else "",
                "title": f"Design {design.id}",
                "designer_name": f"Designer {design.user_id}",
                "price": f"${design.id * 10}",  # Mock pricing
                "likes": design.id * 5,  # Mock likes
                "created_at": design.created_at.isoformat() if design.created_at else ""
            }
            for design in featured_designs
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get featured designs: {str(e)}")