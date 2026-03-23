from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import uuid
import os

from database import get_db
from services.replicate_service import replicate_service
from config import settings

router = APIRouter()

@router.post("/virtual-tryon")
async def virtual_tryon(
    body_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Save images temporarily
        body_filename = f"body_{uuid.uuid4()}.jpg"
        garment_filename = f"garment_{uuid.uuid4()}.jpg"
        
        body_path = f"temp/{body_filename}"
        garment_path = f"temp/{garment_filename}"
        
        os.makedirs("temp", exist_ok=True)
        
        # Save body image
        with open(body_path, "wb") as f:
            content = await body_image.read()
            f.write(content)
        
        with open(garment_path, "wb") as f:
            f.write(await garment_image.read())
        
        # Create URLs for saved images
        body_url = f"{settings.BACKEND_URL}/static/{body_filename}"
        garment_url = f"{settings.BACKEND_URL}/static/{garment_filename}"
        
        # Use real Virtual Try-On model
        
        tryon_result_url = await replicate_service.virtual_tryon(body_url, garment_url)
        
        return {
            "tryon_result_url": tryon_result_url,
            "body_url": body_url,
            "garment_url": garment_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Virtual try-on failed: {str(e)}")

@router.post("/analyze-body")
async def analyze_body_measurements(
    body_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Save image temporarily
        body_filename = f"analysis_{uuid.uuid4()}.jpg"
        body_path = f"temp/{body_filename}"
        
        os.makedirs("temp", exist_ok=True)
        
        with open(body_path, "wb") as f:
            content = await body_image.read()
            f.write(content)
        
        # TODO: Implement body measurement analysis
        # This would use computer vision to extract measurements
        # For now, return mock data
        
        mock_measurements = {
            "height": 170.0,
            "chest": 96.0,
            "waist": 78.0,
            "hips": 102.0,
            "shoulder_width": 42.0,
            "sleeve_length": 60.0,
            "inseam": 76.0,
            "neck": 38.0,
            "recommended_sizes": {
                "tops": "M",
                "bottoms": "M",
                "dresses": "M"
            }
        }
        
        return mock_measurements
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Body analysis failed: {str(e)}")
