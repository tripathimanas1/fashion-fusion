from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os, uuid, requests as req_lib, uuid as uuid_lib
from datetime import datetime
from services.s3_service import s3_service
import io
from database import get_db
from services.replicate_service import replicate_service
from config import settings
from services.palette_service import palette_service
from services.sentence_transformer_service import sentence_service
from models.design import Design
from models.saved_design import SavedDesign
from models.board import Board

router = APIRouter()

# ── Pydantic schemas (must be defined before use) ────────────────────────────

class StyleBlend(BaseModel):
    style: str  # "modern", "traditional", "fusion", "minimalist", "bohemian", "cyberpunk", "vintage"
    weight: float = 50.0  # 0-100 percentage

class MultiStyleRequest(BaseModel):
    prompt: str
    styles: List[StyleBlend]
    num_outputs: int = 2
    user_id: int
    generation_type: str = "multi-style"

class RecolorRequest(BaseModel):
    design_id: int
    target_colors: List[str] = []  # List of hex colors to apply
    fabric_type: Optional[str] = None  # Target fabric type (cotton, silk, denim, etc.)
    preserve_highlights: bool = True  # Preserve lighting/shadows
    add_as_variation: bool = True  # Add to existing design vs create new design

class FabricSwapRequest(BaseModel):
    design_id: int
    target_fabric: str  # Target fabric type
    preserve_pattern: bool = True  # Keep original pattern
    adjust_texture: bool = True  # Apply fabric texture
    add_as_variation: bool = True  # Add to existing design vs create new design

class SaveDesignRequest(BaseModel):
    design_id: int
    user_id: int
    board_id: Optional[int] = None
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _create_style_fusion_prompt(prompt: str, styles: List[StyleBlend]) -> str:
    """Create enhanced prompt with style fusion"""
    style_descriptions = []
    
    for style in styles:
        style_mapping = {
            "modern": "contemporary minimalist design with clean lines and modern aesthetics",
            "traditional": "classic ethnic design with traditional craftsmanship and cultural elements",
            "fusion": "innovative blend of modern and traditional elements",
            "minimalist": "simple, clean design with minimal elements and neutral colors",
            "bohemian": "free-spirited design with flowing fabrics and artistic details",
            "cyberpunk": "futuristic design with tech-inspired elements and bold colors",
            "vintage": "retro-inspired design with classic vintage aesthetics"
        }
        
        style_desc = style_mapping.get(style.style.lower(), style.style)
        weight_percentage = style.weight / 100.0
        style_descriptions.append(f"{weight_percentage:.0%} {style_desc}")
    
    if style_descriptions:
        style_fusion = f"Create a design that is {' + '.join(style_descriptions)}. "
        return f"{style_fusion}The main concept is: {prompt}"
    else:
        return prompt

def _design_to_dict(d: Design) -> dict:
    return {
        "id": d.id,
        "title": d.title,
        "prompt": d.prompt,
        "generation_type": d.generation_type,
        "image_urls": d.image_urls if isinstance(d.image_urls, list) else [],
        "color_palette": d.color_palette or [],
        "style_recommendations": d.style_recommendations or [],
        "fabric_recommendations": d.fabric_recommendations or [],
        "likes_count": d.likes_count or 0,
        "is_public": d.is_public,
        "created_at": d.created_at.isoformat() if d.created_at else "",
        "user": {
            "username": d.user.username if d.user else "anonymous",
            "full_name": d.user.full_name if d.user else "",
        } if d.user else None,
    }




def download_and_save_images(image_urls: list) -> list:
    """Download external images and upload to S3"""
    saved = []

    for url in image_urls:
        # Already S3 → keep it
        if settings.S3_BUCKET in url:
            saved.append(url)
            continue

        try:
            r = req_lib.get(url, timeout=30)
            if r.status_code == 200:
                file_buffer = io.BytesIO(r.content)
                file_buffer.seek(0)

                s3_url = s3_service.upload_file(
                    file_buffer,
                    filename="design.webp",
                    folder="designs"
                )
                saved.append(s3_url)
            else:
                saved.append(url)

        except Exception as e:
            print(f"WARNING: Could not upload {url}: {e}")
            saved.append(url)

    return saved


def _extract_palette_and_style(image_urls: list):
    """Always returns valid empty lists on any failure — never raises."""
    color_palette, fabric_recommendations, style_recommendations = [], [], []
    if not image_urls:
        return color_palette, fabric_recommendations, style_recommendations
    try:
        local_path = image_urls[0].replace(settings.BACKEND_URL, "").lstrip("/")
        color_palette = palette_service.extract_color_palette(local_path) or []
        fabric_recommendations = palette_service.get_fabric_recommendations(color_palette) or []
    except Exception as e:
        print(f"WARNING palette failed (non-fatal): {e}")
        color_palette, fabric_recommendations = [], []
    try:
        # Pass local path to avoid self-HTTP timeout
        local_path = image_urls[0].replace(settings.BACKEND_URL, "").lstrip("/")
        style_recommendations = sentence_service.find_similar_styles(local_path) or []
    except Exception as e:
        print(f"WARNING style failed (non-fatal): {e}")
        style_recommendations = []
    return color_palette, fabric_recommendations, style_recommendations


# ── Routes ────────────────────────────────────────────────────────────────────
# NOTE: specific routes MUST come before /{design_id} catch-all

@router.post("/generate-multi-style")
async def generate_multi_style_design(request: MultiStyleRequest, db: Session = Depends(get_db)):
    """Generate designs with multiple style fusion capabilities"""
    try:
        num_outputs = max(1, min(4, request.num_outputs))
        
        # Create enhanced prompt with style fusion
        enhanced_prompt = _create_style_fusion_prompt(request.prompt, request.styles)
        
        # Generate designs using existing service
        image_urls = await replicate_service.generate_design_from_prompt(
            enhanced_prompt, 
            num_outputs=num_outputs
        )
        
        # Download and save images
        saved_urls = download_and_save_images(image_urls)
        
        # Extract palette and style recommendations
        color_palette, fabric_recommendations, style_recommendations = _extract_palette_and_style(saved_urls)
        
        # Create design record
        design = Design(
            title=f"Multi-Style: {request.prompt[:50]}...",
            prompt=enhanced_prompt,
            generation_type="multi-style",
            image_urls=saved_urls,
            color_palette=color_palette,
            fabric_recommendations=fabric_recommendations,
            style_recommendations=style_recommendations,
            user_id=request.user_id,
            is_public=True,  # Make designs visible in marketplace
            created_at=datetime.utcnow()
        )
        
        db.add(design)
        db.commit()
        db.refresh(design)
        
        return {
            "success": True,
            "design_id": design.id,
            "image_urls": saved_urls,
            "color_palette": color_palette,
            "style_recommendations": style_recommendations,
            "fabric_recommendations": fabric_recommendations,
            "enhanced_prompt": enhanced_prompt,
            "style_fusion": [{"style": s.style, "weight": s.weight} for s in request.styles]
        }
        
    except Exception as e:
        print(f"Multi-style generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Multi-style generation failed: {str(e)}")


@router.post("/recolor")
async def recolor_design(request: RecolorRequest, db: Session = Depends(get_db)):
    """AI-powered recoloring of existing designs."""
    try:
        # Get original design
        design = db.query(Design).filter(Design.id == request.design_id).first()
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        if not design.image_urls or len(design.image_urls) == 0:
            raise HTTPException(status_code=400, detail="No images found for recoloring")
        
        # Create enhanced prompt for recoloring
        color_instruction = f"Recolor this design with these colors: {', '.join(request.target_colors)}"
        if request.fabric_type:
            color_instruction += f". Change fabric to {request.fabric_type} texture"
        
        enhanced_prompt = f"{color_instruction}. Original design: {design.prompt}"
        
        # Generate recolored designs
        image_urls = await replicate_service.generate_design_from_prompt(
            enhanced_prompt, 
            num_outputs=2
        )
        
        # Download and save new images
        saved_urls = download_and_save_images(image_urls)
        
        if request.add_as_variation:
            # Add new images to existing design
            updated_image_urls = design.image_urls + saved_urls
            design.image_urls = updated_image_urls
            db.commit()
            
            return {
                "success": True,
                "design_id": design.id,
                "image_urls": saved_urls,
                "total_images": len(updated_image_urls),
                "new_images_count": len(saved_urls),
                "message": f"Added {len(saved_urls)} new variation(s) to design"
            }
        else:
            # Create new design record (legacy behavior)
            color_palette, fabric_recommendations, style_recommendations = _extract_palette_and_style(saved_urls)
            
            new_design = Design(
                user_id=design.user_id,
                is_public=True,
                title=f"Recolored: {design.title or 'Design'}",
                prompt=enhanced_prompt,
                generation_type="recolor",
                reference_image_url=design.image_urls[0] if design.image_urls else None,
                image_urls=saved_urls,
                color_palette=color_palette,
                fabric_recommendations=fabric_recommendations,
                style_recommendations=style_recommendations
            )
            
            db.add(new_design)
            db.commit()
            db.refresh(new_design)
            
            return {
                "success": True,
                "design_id": new_design.id,
                "image_urls": saved_urls,
                "color_palette": color_palette,
                "style_recommendations": style_recommendations,
                "fabric_recommendations": fabric_recommendations,
                "original_design_id": design.id,
                "recolor_colors": request.target_colors
            }
        
    except Exception as e:
        print(f"Recolor error: {e}")
        raise HTTPException(status_code=500, detail=f"Recolor failed: {str(e)}")


@router.post("/fabric-swap")
async def swap_fabric(request: FabricSwapRequest, db: Session = Depends(get_db)):
    """AI-powered fabric texture swapping."""
    try:
        # Get original design
        design = db.query(Design).filter(Design.id == request.design_id).first()
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        
        if not design.image_urls or len(design.image_urls) == 0:
            raise HTTPException(status_code=400, detail="No images found for fabric swap")
        
        # Create enhanced prompt for fabric swap
        fabric_instruction = f"Change fabric to {request.target_fabric}"
        if request.preserve_pattern:
            fabric_instruction += " while preserving original pattern"
        if request.adjust_texture:
            fabric_instruction += f" with realistic {request.target_fabric} texture"
        
        enhanced_prompt = f"{fabric_instruction}. Original design: {design.prompt}"
        
        # Generate fabric-swapped designs
        image_urls = await replicate_service.generate_design_from_prompt(
            enhanced_prompt, 
            num_outputs=2
        )
        
        # Download and save new images
        saved_urls = download_and_save_images(image_urls)
        
        if request.add_as_variation:
            # Add new images to existing design
            updated_image_urls = design.image_urls + saved_urls
            design.image_urls = updated_image_urls
            db.commit()
            
            return {
                "success": True,
                "design_id": design.id,
                "image_urls": saved_urls,
                "total_images": len(updated_image_urls),
                "new_images_count": len(saved_urls),
                "message": f"Added {len(saved_urls)} new fabric variation(s) to design"
            }
        else:
            # Create new design record (legacy behavior)
            color_palette, fabric_recommendations, style_recommendations = _extract_palette_and_style(saved_urls)
            
            new_design = Design(
                user_id=design.user_id,
                is_public=True,
                title=f"Fabric Swap: {design.title or 'Design'}",
                prompt=enhanced_prompt,
                generation_type="fabric-swap",
                reference_image_url=design.image_urls[0] if design.image_urls else None,
                image_urls=saved_urls,
                color_palette=color_palette,
                fabric_recommendations=[request.target_fabric] + " texture",
                style_recommendations=style_recommendations
            )
            
            db.add(new_design)
            db.commit()
            db.refresh(new_design)
            
            return {
                "success": True,
                "design_id": new_design.id,
                "image_urls": saved_urls,
                "color_palette": color_palette,
                "style_recommendations": style_recommendations,
                "fabric_recommendations": fabric_recommendations,
                "original_design_id": design.id,
                "target_fabric": request.target_fabric
            }
        
    except Exception as e:
        print(f"Fabric swap error: {e}")
        raise HTTPException(status_code=500, detail=f"Fabric swap failed: {str(e)}")


@router.post("/generate")
async def generate_design(
    prompt: str = Form(...),
    reference_image: Optional[UploadFile] = File(None),
    generation_type: str = Form("prompt"),
    user_id: int = Form(...),
    num_outputs: int = Form(2),
    db: Session = Depends(get_db)
):
    try:
        num_outputs = max(1, min(4, num_outputs))
        reference_url = None
        if generation_type == "prompt":
            image_urls = await replicate_service.generate_design_from_prompt(prompt, num_outputs=num_outputs)
        elif generation_type == "image" and reference_image:
            file_buffer = io.BytesIO(await reference_image.read())
            file_buffer.seek(0)

            reference_url = s3_service.upload_file(
                file_buffer,
                filename="reference.jpg",
                folder="temp"
            )
            image_urls = await replicate_service.generate_design_from_image(prompt, reference_url, num_outputs=num_outputs)
        else:
            raise HTTPException(status_code=400, detail="Invalid generation type or missing reference image")

        image_urls = download_and_save_images(image_urls)
        color_palette, fabric_recommendations, style_recommendations = _extract_palette_and_style(image_urls)

        design = Design(
            user_id=user_id, is_public=True,
            title=f"Generated Design {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            prompt=prompt, generation_type=generation_type,
            reference_image_url=reference_url,
            image_urls=image_urls, color_palette=color_palette,
            style_recommendations=style_recommendations,
            fabric_recommendations=fabric_recommendations
        )
        db.add(design); db.commit(); db.refresh(design)
        return {"design_id": design.id, "image_urls": image_urls,
                "color_palette": color_palette, "style_recommendations": style_recommendations,
                "fabric_recommendations": fabric_recommendations}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sketch-to-design")
async def sketch_to_design(
    sketch: UploadFile = File(...),
    prompt: str = Form("fashion design"),
    user_id: int = Form(...),
    num_outputs: int = Form(2),
    db: Session = Depends(get_db)
):
    try:
        num_outputs = max(1, min(4, num_outputs))
        

        file_buffer = io.BytesIO(await sketch.read())
        file_buffer.seek(0)

        sketch_url = s3_service.upload_file(
            file_buffer,
            filename="sketch.jpg",
            folder="temp"
        )

        image_urls = await replicate_service.sketch_to_design(sketch_url, prompt, num_outputs=num_outputs)
        image_urls = download_and_save_images(image_urls)
        color_palette, fabric_recommendations, style_recommendations = _extract_palette_and_style(image_urls)

        design = Design(
            user_id=user_id, is_public=True,
            title=f"Sketch Design {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            prompt=prompt, generation_type="sketch",
            reference_image_url=sketch_url, image_urls=image_urls,
            color_palette=color_palette, style_recommendations=style_recommendations,
            fabric_recommendations=fabric_recommendations
        )
        db.add(design); db.commit(); db.refresh(design)
        return {"design_id": design.id, "image_urls": image_urls,
                "color_palette": color_palette, "style_recommendations": style_recommendations,
                "fabric_recommendations": fabric_recommendations}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── SPECIFIC routes BEFORE /{design_id} ──────────────────────────────────────

@router.get("/user/{user_id}")
async def get_user_designs(user_id: int, db: Session = Depends(get_db)):
    """All designs created by this user."""
    designs = db.query(Design).filter(Design.user_id == user_id).order_by(Design.created_at.desc()).all()
    return [_design_to_dict(d) for d in designs]


@router.get("/saved/{user_id}/count")
async def get_saved_count(user_id: int, db: Session = Depends(get_db)):
    """Count saved designs — used by UserProfile stats."""
    try:
        count = db.query(SavedDesign).filter(SavedDesign.user_id == user_id).count()
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved/{user_id}")
async def get_saved_designs(user_id: int, db: Session = Depends(get_db)):
    """All designs saved/bookmarked by a user."""
    try:
        saved = (db.query(SavedDesign)
                 .filter(SavedDesign.user_id == user_id)
                 .order_by(SavedDesign.saved_at.desc())
                 .all())
        result = []
        for s in saved:
            d = s.design
            if not d:
                continue
            result.append({
                "saved_design_id": s.id,
                "saved_at": s.saved_at.isoformat() if s.saved_at else "",
                "board_id": s.board_id,
                "design": _design_to_dict(d)
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/saved/{saved_design_id}")
async def unsave_design(saved_design_id: int, user_id: int, db: Session = Depends(get_db)):
    try:
        saved = db.query(SavedDesign).filter(
            SavedDesign.id == saved_design_id,
            SavedDesign.user_id == user_id
        ).first()
        if not saved:
            raise HTTPException(status_code=404, detail="Saved design not found")
        db.delete(saved); db.commit()
        return {"message": "Removed from saved"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_design(body: SaveDesignRequest, db: Session = Depends(get_db)):
    try:
        design = db.query(Design).filter(Design.id == body.design_id).first()
        if not design:
            raise HTTPException(status_code=404, detail="Design not found")
        existing = db.query(SavedDesign).filter(
            SavedDesign.user_id == body.user_id,
            SavedDesign.design_id == body.design_id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Design already saved")
        sd = SavedDesign(user_id=body.user_id, design_id=body.design_id, board_id=body.board_id)
        db.add(sd); db.commit(); db.refresh(sd)
        return {"message": "Design saved", "saved_design_id": sd.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/boards/{user_id}")
async def get_user_boards(user_id: int, db: Session = Depends(get_db)):
    boards = db.query(Board).filter(Board.user_id == user_id).order_by(Board.created_at.desc()).all()
    return boards


@router.post("/boards")
async def create_board(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    try:
        board = Board(user_id=user_id, name=name, description=description)
        db.add(board); db.commit(); db.refresh(board)
        return board
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/public")
async def get_public_designs(db: Session = Depends(get_db)):
    """All public designs for marketplace — ordered by newest first."""
    designs = (
        db.query(Design)
        .filter(Design.is_public == True)
        .order_by(Design.created_at.desc())
        .all()
    )
    return [_design_to_dict(d) for d in designs]


# ── CATCH-ALL — must be LAST ──────────────────────────────────────────────────

@router.get("/{design_id}")
async def get_design(design_id: int, db: Session = Depends(get_db)):
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return _design_to_dict(design)