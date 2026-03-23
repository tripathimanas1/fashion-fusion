from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from config import settings
from services.clip_service_simple import clip_service
from sqlalchemy.orm import Session
from typing import List
import uuid
import os

from services.sentence_transformer_service import sentence_service
from models.design import Design
from database import get_db

router = APIRouter()

@router.post("/styles/from-image")
async def recommend_styles_from_image(
    image: UploadFile = File(...),
    top_k: int = Form(5),
    db: Session = Depends(get_db)
):
    try:
        # Save image temporarily
        image_filename = f"rec_{uuid.uuid4()}.jpg"
        image_path = f"temp/{image_filename}"
        
        os.makedirs("temp", exist_ok=True)
        
        with open(image_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        # Convert to URL (in production, upload to S3)
        image_url = f"{settings.BACKEND_URL}/temp/{image_filename}"
        
        # Get style recommendations from image
        recommendations = sentence_service.find_similar_styles(image_url, top_k)
        
        return {
            "image_url": image_url,
            "recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Style recommendation failed: {str(e)}")

@router.post("/styles/from-prompt")
async def recommend_styles_from_prompt(
    prompt: str = Form(...),
    top_k: int = Form(5),
    db: Session = Depends(get_db)
):
    try:
        # Get style recommendations from prompt
        recommendations = sentence_service.recommend_from_prompt(prompt, top_k)
        
        return {
            "prompt": prompt,
            "recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt recommendation failed: {str(e)}")

@router.get("/similar-designs/{design_id}")
async def get_similar_designs(
    design_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    try:
        # Get the design
        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        if not design.image_urls or len(design.image_urls) == 0:
            raise HTTPException(status_code=400, detail="No images found for design")
        
        # Get style recommendations from first image
        recommendations = sentence_service.find_similar_styles(design.image_urls[0], limit)
        
        # Find similar designs based on style recommendations
        similar_designs = []
        for rec in recommendations:
            # Search for designs with similar styles in database
            # This is a simplified approach - in production, you'd use vector similarity
            similar = db.query(Design).filter(
                Design.id != design_id,
                Design.is_public == True
            ).limit(2).all()  # Get 2 designs per style recommendation
            
            similar_designs.extend(similar)
        
        # Remove duplicates and limit results
        unique_designs = []
        seen_ids = set()
        for design in similar_designs:
            if design.id not in seen_ids:
                unique_designs.append(design)
                seen_ids.add(design.id)
                if len(unique_designs) >= limit:
                    break
        
        return {
            "original_design_id": design_id,
            "similar_designs": unique_designs[:limit]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similar designs search failed: {str(e)}")

@router.get("/trending")
async def get_trending_designs(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    try:
        # Get trending designs based on likes_count and recent creation
        trending = db.query(Design).filter(
            Design.is_public == True
        ).order_by(
            Design.likes_count.desc(),
            Design.created_at.desc()
        ).limit(limit).all()
        
        return {
            "trending_designs": [
                {
                    "id": d.id,
                    "title": d.title,
                    "prompt": d.prompt,
                    "image_urls": d.image_urls if isinstance(d.image_urls, list) else [],
                    "color_palette": d.color_palette or [],
                    "style_recommendations": d.style_recommendations or [],
                    "fabric_recommendations": d.fabric_recommendations or [],
                    "likes_count": d.likes_count or 0,
                    "created_at": d.created_at.isoformat() if d.created_at else "",
                    "user": {
                        "username": d.user.username if d.user else "anonymous",
                        "full_name": d.user.full_name if d.user else ""
                    } if d.user else None
                }
                for d in trending
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trending designs fetch failed: {str(e)}")

@router.get("/for-you/{user_id}")
async def get_personalized_recommendations(
    user_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    try:
        # Get user's saved designs to understand preferences
        from models.design import SavedDesign
        user_saved = db.query(SavedDesign).filter(
            SavedDesign.user_id == user_id
        ).limit(10).all()
        
        if not user_saved:
            # If no saved designs, return trending designs
            trending = db.query(Design).filter(
                Design.is_public == True
            ).order_by(Design.likes_count.desc()).limit(limit).all()
            return {"recommendations": [
                {"id": d.id, "title": d.title, "prompt": d.prompt,
                 "image_urls": d.image_urls if isinstance(d.image_urls, list) else [],
                 "likes_count": d.likes_count or 0,
                 "created_at": d.created_at.isoformat() if d.created_at else ""}
                for d in trending
            ]}
        
        # Analyze user's style preferences from saved designs
        # This is simplified - in production, you'd use ML-based recommendations
        design_ids = [sd.design_id for sd in user_saved]
        user_designs = db.query(Design).filter(Design.id.in_(design_ids)).all()
        
        # Get recommendations based on user's design styles
        recommendations = []
        for design in user_designs[:3]:  # Analyze first 3 designs
            if design.image_urls:
                style_recs = clip_service.find_similar_styles(design.image_urls[0], 3)
                # Find designs matching these styles
                similar = db.query(Design).filter(
                    Design.id.notin_(design_ids),
                    Design.is_public == True
                ).limit(2).all()
                recommendations.extend(similar)
        
        # Remove duplicates and limit results
        unique_recs = []
        seen_ids = set()
        for rec in recommendations:
            if rec.id not in seen_ids:
                unique_recs.append(rec)
                seen_ids.add(rec.id)
                if len(unique_recs) >= limit:
                    break
        
        return {"recommendations": [
            {"id": d.id, "title": d.title, "prompt": d.prompt,
             "image_urls": d.image_urls if isinstance(d.image_urls, list) else [],
             "likes_count": d.likes_count or 0,
             "created_at": d.created_at.isoformat() if d.created_at else ""}
            for d in unique_recs
        ]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Personalized recommendations failed: {str(e)}")