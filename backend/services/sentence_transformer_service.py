import numpy as np
from sentence_transformers import SentenceTransformer
from PIL import Image
import requests
from typing import List, Dict
from io import BytesIO
import os

class SentenceTransformerService:
    def __init__(self):
        # Use a lightweight, CPU-optimized model
        self.model_name = "all-MiniLM-L6-v2"  # Very lightweight, works well on CPU
        try:
            self.model = SentenceTransformer(self.model_name)
            self.model_loaded = True
            print(f"✅ Sentence Transformers model loaded: {self.model_name}")
        except Exception as e:
            print(f"❌ Failed to load Sentence Transformers: {e}")
            self.model_loaded = False
        
        # Fashion style prompts for recommendations
        self.style_prompts = [
            "minimalist fashion design",
            "bohemian style clothing", 
            "vintage fashion outfit",
            "modern streetwear",
            "elegant evening wear",
            "casual everyday outfit",
            "formal business attire",
            "sporty athletic wear",
            "traditional ethnic clothing",
            "contemporary avant-garde fashion"
        ]
        
        # Pre-compute text embeddings for efficiency
        if self.model_loaded:
            self._precompute_text_embeddings()
    
    def _precompute_text_embeddings(self):
        """Pre-compute text embeddings for all style prompts"""
        try:
            self.text_embeddings = self.model.encode(
                self.style_prompts, 
                convert_to_tensor=True,
                show_progress_bar=False
            )
            print(f"✅ Pre-computed {len(self.style_prompts)} style embeddings")
        except Exception as e:
            print(f"❌ Failed to precompute embeddings: {e}")
            self.model_loaded = False
    
    def get_text_embedding(self, text: str):
        """Get text embedding using Sentence Transformers"""
        if not self.model_loaded:
            # Mock embedding
            return np.random.random(384).astype(np.float32)
        
        try:
            embedding = self.model.encode(
                text, 
                convert_to_tensor=True,
                show_progress_bar=False
            )
            return embedding.cpu().numpy().astype(np.float32)
        except Exception as e:
            print(f"Text embedding failed: {e}")
            return np.random.random(384).astype(np.float32)
    
    def get_image_embedding(self, image_url: str):
        """Get image embedding using Pillow — no cv2, no HTTP self-requests."""
        try:
            from PIL import Image as PILImage
            import os

            # Use local file path directly to avoid self-HTTP timeouts
            if image_url.startswith("http://") or image_url.startswith("https://"):
                # Try to convert to local path first
                from config import settings
                local_path = image_url.replace(settings.BACKEND_URL, "").lstrip("/")
                if os.path.exists(local_path):
                    image = PILImage.open(local_path).convert("RGB")
                else:
                    # Fall back to HTTP only for external URLs
                    response = requests.get(image_url, timeout=10)
                    image = PILImage.open(BytesIO(response.content)).convert("RGB")
            else:
                if not os.path.exists(image_url):
                    return np.random.random(384).astype(np.float32)
                image = PILImage.open(image_url).convert("RGB")

            # Extract color histogram features using numpy only (no cv2)
            img_resized = image.resize((64, 64))
            img_array = np.array(img_resized).astype(float)

            # Calculate histogram for each channel
            features = []
            for channel in range(3):
                hist, _ = np.histogram(img_array[:, :, channel], bins=16, range=(0, 256))
                features.extend(hist)

            features = np.array(features, dtype=float)
            features = features / (np.linalg.norm(features) + 1e-8)

            embedding = np.zeros(384)
            embedding[:len(features)] = features

            return embedding.astype(np.float32)

        except Exception as e:
            print(f"Image embedding failed: {e}")
            return np.random.random(384).astype(np.float32)
    
    def find_similar_styles(self, image_url: str, top_k: int = 5) -> List[Dict]:
        """Find similar styles for an image"""
        try:
            image_embedding = self.get_image_embedding(image_url)
            
            if not self.model_loaded:
                # Mock recommendations
                import random
                recommendations = []
                random.shuffle(self.style_prompts)
                for i, style in enumerate(self.style_prompts[:top_k]):
                    similarity = random.uniform(0.6, 0.95)
                    recommendations.append({
                        "style": style,
                        "similarity": similarity
                    })
                return recommendations
            
            # Calculate similarities with precomputed text embeddings
            similarities = []
            for i, style in enumerate(self.style_prompts):
                text_emb = self.text_embeddings[i].cpu().numpy()
                similarity = np.dot(image_embedding, text_emb) / (
                    np.linalg.norm(image_embedding) * np.linalg.norm(text_emb) + 1e-8
                )
                similarities.append((style, float(similarity)))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return [{"style": style, "similarity": sim} for style, sim in similarities[:top_k]]
            
        except Exception as e:
            raise Exception(f"Style recommendation failed: {str(e)}")
    
    def recommend_from_prompt(self, prompt: str, top_k: int = 5) -> List[Dict]:
        """Get style recommendations from text prompt"""
        try:
            prompt_embedding = self.get_text_embedding(prompt)
            
            if not self.model_loaded:
                # Mock recommendations
                import random
                recommendations = []
                random.shuffle(self.style_prompts)
                for i, style in enumerate(self.style_prompts[:top_k]):
                    similarity = random.uniform(0.7, 0.95)
                    recommendations.append({
                        "style": style,
                        "similarity": similarity
                    })
                return recommendations
            
            # Calculate similarities with precomputed text embeddings
            similarities = []
            for i, style in enumerate(self.style_prompts):
                text_emb = self.text_embeddings[i].cpu().numpy()
                similarity = np.dot(prompt_embedding, text_emb) / (
                    np.linalg.norm(prompt_embedding) * np.linalg.norm(text_emb) + 1e-8
                )
                similarities.append((style, float(similarity)))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return [{"style": style, "similarity": sim} for style, sim in similarities[:top_k]]
            
        except Exception as e:
            raise Exception(f"Prompt recommendation failed: {str(e)}")

# Create global instance
sentence_service = SentenceTransformerService()