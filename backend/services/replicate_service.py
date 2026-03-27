"""
Image generation using Google AI Studio (Gemini).
Calls the SDK directly and stores generated assets in S3.
"""

import os
import base64
from typing import List
from urllib.request import urlopen
import io

from config import settings
from services.s3_service import s3_service


def _get_api_key() -> str:
    key = getattr(settings, "GOOGLE_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    if not key:
        raise Exception(
            "GOOGLE_API_KEY not set. Get a free key at https://aistudio.google.com/apikey "
            "and add it to your .env: GOOGLE_API_KEY=AIza..."
        )
    return key


def _save_bytes(image_bytes: bytes) -> str:
    """Upload generated image directly to S3."""
    file_buffer = io.BytesIO(image_bytes)
    file_buffer.seek(0)
    return s3_service.upload_file(
        file_buffer,
        filename="generated.png",
        folder="designs",
    )


def _save_tryon_bytes(image_bytes: bytes) -> str:
    """Upload virtual try-on output directly to S3."""
    file_buffer = io.BytesIO(image_bytes)
    file_buffer.seek(0)
    return s3_service.upload_file(
        file_buffer,
        filename="tryon.png",
        folder="tryon_outputs",
    )


def _download_image_bytes(url: str) -> bytes:
    """Download image bytes for Gemini multimodal input."""
    with urlopen(url) as resp:
        return resp.read()


def _generate_one(prompt: str) -> str:
    """Generate one fashion image from prompt using Gemini."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=_get_api_key())
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="1:1"),
        ),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            data = part.inline_data.data
            image_bytes = base64.b64decode(data) if isinstance(data, str) else data
            return _save_bytes(image_bytes)

    raise Exception("Gemini returned no image in response")


class ImageGenerationService:
    """Gemini-backed image generation service."""

    def __init__(self):
        print("ImageGenerationService initialized (Google Gemini)")

    async def generate_design_from_prompt(self, prompt: str, num_outputs: int = 4) -> List[str]:
        fashion_prompt = (
            f"A professional fashion design photograph: {prompt}. "
            "High quality clothing design, studio photography, detailed fabric texture."
        )
        return self._generate_batch(fashion_prompt, num_outputs)

    async def generate_design_from_image(self, prompt: str, image_url: str, num_outputs: int = 4) -> List[str]:
        enriched = (
            f"A professional fashion design inspired by reference style: {prompt}. "
            "High quality, detailed clothing design."
        )
        return self._generate_batch(enriched, num_outputs)

    async def sketch_to_design(self, sketch_url: str, prompt: str = "fashion design", num_outputs: int = 4) -> List[str]:
        sketch_prompt = (
            f"A professional fashion design based on sketch: {prompt}. "
            "Clean detailed clothing illustration, fashion week quality."
        )
        return self._generate_batch(sketch_prompt, num_outputs)

    def _generate_batch(self, prompt: str, num_outputs: int) -> List[str]:
        """Generate images one at a time."""
        urls: List[str] = []
        for i in range(num_outputs):
            try:
                url = _generate_one(prompt)
                urls.append(url)
                print(f"Image {i + 1}/{num_outputs} saved: {url.split('/')[-1]}")
            except Exception as e:
                print(f"Image {i + 1}/{num_outputs} failed: {e}")
        if not urls:
            raise Exception("All image generation attempts failed")
        return urls

    async def virtual_tryon(self, body_image_url: str, garment_image_url: str) -> str:
        """Generate virtual try-on image with Gemini and upload result to S3."""
        from google import genai
        from google.genai import types

        body_bytes = _download_image_bytes(body_image_url)
        garment_bytes = _download_image_bytes(garment_image_url)

        prompt = (
            "Create a realistic virtual try-on image using the two references. "
            "Use the first image as the person/body reference and preserve identity, face, pose, "
            "body proportions, and background as much as possible. "
            "Use the second image as the garment reference and apply its garment style, fit, "
            "fabric details, and color naturally to the person in the first image. "
            "Output one photorealistic final image only."
        )

        client = genai.Client(api_key=_get_api_key())
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[
                prompt,
                types.Part.from_bytes(data=body_bytes, mime_type="image/jpeg"),
                types.Part.from_bytes(data=garment_bytes, mime_type="image/jpeg"),
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data:
                data = part.inline_data.data
                image_bytes = base64.b64decode(data) if isinstance(data, str) else data
                return _save_tryon_bytes(image_bytes)

        raise Exception("Gemini returned no try-on image")

    async def _call_tryon_api(self, body_image_url: str, garment_image_url: str, api_key: str) -> str:
        return body_image_url


replicate_service = ImageGenerationService()
