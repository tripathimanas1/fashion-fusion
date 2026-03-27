from __future__ import annotations

import io
import os
import uuid
from pathlib import Path
from typing import Literal
from urllib.request import Request, urlopen

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageChops, ImageFilter, ImageOps


APP_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = APP_DIR / "tryon_outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

MAX_IMAGE_SIDE = 1280
DEFAULT_GARMENT_TYPE = "top"

app = FastAPI(
    title="Lightweight Virtual Try-On API",
    version="1.0.0",
    description="CPU-friendly virtual try-on using classical image processing only.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")


def _open_and_normalize(image_bytes: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}") from exc

    image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.Resampling.LANCZOS)
    return image


async def _read_upload(upload: UploadFile) -> Image.Image:
    image_bytes = await upload.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail=f"{upload.filename or 'image'} is empty")
    return _open_and_normalize(image_bytes)


def _read_image_from_url(url: str) -> Image.Image:
    try:
        request = Request(url, headers={"User-Agent": "lightweight-tryon/1.0"})
        with urlopen(request, timeout=10) as response:
            return _open_and_normalize(response.read())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not fetch garment image: {exc}") from exc


def _build_background_mask(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size

    sample_points = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
    ]
    corners = [rgb.getpixel(point) for point in sample_points]
    avg = tuple(sum(channel[i] for channel in corners) // len(corners) for i in range(3))

    background = Image.new("RGB", rgb.size, avg)
    diff = ImageChops.difference(rgb, background).convert("L")
    diff = ImageOps.autocontrast(diff)

    mask = diff.point(lambda px: 255 if px > 28 else 0, mode="L")
    mask = mask.filter(ImageFilter.MedianFilter(size=3))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))
    return mask


def _tight_bbox(mask: Image.Image) -> tuple[int, int, int, int]:
    bbox = mask.getbbox()
    if bbox:
        return bbox
    width, height = mask.size
    return (0, 0, width, height)


def _estimate_target_box(
    person_size: tuple[int, int],
    garment_type: Literal["top", "bottom", "full"],
) -> tuple[int, int, int, int]:
    width, height = person_size
    center_x = width // 2

    if garment_type == "bottom":
        top = int(height * 0.50)
        bottom = int(height * 0.94)
        box_width = int(width * 0.36)
    elif garment_type == "full":
        top = int(height * 0.18)
        bottom = int(height * 0.92)
        box_width = int(width * 0.46)
    else:
        top = int(height * 0.18)
        bottom = int(height * 0.62)
        box_width = int(width * 0.42)

    left = max(0, center_x - box_width // 2)
    right = min(width, center_x + box_width // 2)
    return (left, top, right, bottom)


def _fit_garment_to_box(
    garment: Image.Image,
    garment_mask: Image.Image,
    target_box: tuple[int, int, int, int],
) -> tuple[Image.Image, Image.Image, tuple[int, int]]:
    g_left, g_top, g_right, g_bottom = _tight_bbox(garment_mask)
    garment = garment.crop((g_left, g_top, g_right, g_bottom))
    garment_mask = garment_mask.crop((g_left, g_top, g_right, g_bottom))

    target_width = max(1, target_box[2] - target_box[0])
    target_height = max(1, target_box[3] - target_box[1])

    scale = min(target_width / garment.width, target_height / garment.height)
    new_size = (
        max(1, int(garment.width * scale)),
        max(1, int(garment.height * scale)),
    )

    garment = garment.resize(new_size, Image.Resampling.LANCZOS)
    garment_mask = garment_mask.resize(new_size, Image.Resampling.LANCZOS)

    x = target_box[0] + (target_width - new_size[0]) // 2
    y = target_box[1]
    return garment, garment_mask, (x, y)


def _soften_mask(mask: Image.Image) -> Image.Image:
    mask = ImageOps.autocontrast(mask)
    return mask.filter(ImageFilter.GaussianBlur(radius=2))


def _composite_tryon(
    person: Image.Image,
    garment: Image.Image,
    garment_type: Literal["top", "bottom", "full"],
) -> Image.Image:
    result = person.copy().convert("RGBA")
    garment_mask = _build_background_mask(garment)
    target_box = _estimate_target_box(result.size, garment_type)
    garment, garment_mask, position = _fit_garment_to_box(garment, garment_mask, target_box)

    garment = garment.copy()
    garment.putalpha(_soften_mask(garment_mask))
    result.alpha_composite(garment, dest=position)
    return result


def _save_result(image: Image.Image) -> str:
    filename = f"{uuid.uuid4().hex}.png"
    image.save(OUTPUT_DIR / filename, format="PNG", optimize=True)
    return filename


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Lightweight virtual try-on API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/virtual-tryon")
async def virtual_tryon(
    body_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    garment_type: Literal["top", "bottom", "full"] = Form(DEFAULT_GARMENT_TYPE),
) -> dict[str, str]:
    person = await _read_upload(body_image)
    garment = await _read_upload(garment_image)

    try:
        output = _composite_tryon(person, garment, garment_type)
        filename = _save_result(output)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Try-on failed: {exc}") from exc

    return {
        "tryon_result_url": f"/outputs/{filename}",
        "garment_type": garment_type,
    }


@app.post("/virtual-tryon-url")
async def virtual_tryon_from_url(
    body_image: UploadFile = File(...),
    garment_url: str = Form(...),
    garment_type: Literal["top", "bottom", "full"] = Form(DEFAULT_GARMENT_TYPE),
) -> dict[str, str]:
    person = await _read_upload(body_image)
    garment = _read_image_from_url(garment_url)

    try:
        output = _composite_tryon(person, garment, garment_type)
        filename = _save_result(output)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Try-on failed: {exc}") from exc

    return {
        "tryon_result_url": f"/outputs/{filename}",
        "garment_type": garment_type,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("TRY_ON_PORT", "8010"))
    uvicorn.run("try_on:app", host="0.0.0.0", port=port, reload=False)
