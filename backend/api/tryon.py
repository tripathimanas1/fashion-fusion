from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import uuid
import os

from database import get_db
from services.replicate_service import replicate_service
from services.s3_service import s3_service
import io

router = APIRouter()

@router.post("/virtual-tryon")
async def virtual_tryon(
    body_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Upload input images to S3 so Gemini can fetch them via public URLs.
        body_buffer = io.BytesIO(await body_image.read())
        body_buffer.seek(0)
        body_url = s3_service.upload_file(
            body_buffer,
            filename=f"body_{uuid.uuid4()}.jpg",
            folder="tryon_inputs",
        )

        garment_buffer = io.BytesIO(await garment_image.read())
        garment_buffer.seek(0)
        garment_url = s3_service.upload_file(
            garment_buffer,
            filename=f"garment_{uuid.uuid4()}.jpg",
            folder="tryon_inputs",
        )
        
        # Use real Virtual Try-On model
        
        tryon_result_url = await replicate_service.virtual_tryon(body_url, garment_url)
        
        return {
            "tryon_result_url": tryon_result_url,
            "body_url": body_url,
            "garment_url": garment_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Virtual try-on failed: {str(e)}")


@router.post("/virtual-tryon-url")
async def virtual_tryon_url(
    body_image: UploadFile = File(...),
    garment_url: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Upload body image to S3; garment URL is already remote.
        body_buffer = io.BytesIO(await body_image.read())
        body_buffer.seek(0)
        body_url = s3_service.upload_file(
            body_buffer,
            filename=f"body_{uuid.uuid4()}.jpg",
            folder="tryon_inputs",
        )

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
