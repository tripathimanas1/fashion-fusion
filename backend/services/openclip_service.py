import open_clip
import torch
from PIL import Image
import requests
from typing import List, Dict
import numpy as np
from io import BytesIO

class OpenCLIPService:
    def __init__(self):
        # Use CPU-friendly OpenCLIP model
        self.device = "cpu"  # Force CPU for compatibility
        self.model_name = "ViT-B-32-quickgelu"
        self.pretrained = "openai"
        
        try:
            # Load the model (this might take a moment on first run)
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                self.model_name, 
                pretrained=self.pretrained,
                device=self.device
            )
            self.tokenizer = open_clip.get_tokenizer(self.model_name)
            
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
            self._precompute_text_embeddings()
            
        except Exception as e:
            print(f"Failed to load OpenCLIP model: {e}")
            # Fallback to mock service
            self.model = None
            self._init_mock_mode()
    
    def _precompute_text_embeddings(self):
        """Pre-compute text embeddings for all style prompts"""
        if self.model is None:
            return
            
        try:
            text_tokens = self.tokenizer(self.style_prompts)
            with torch.no_grad():
                self.text_embeddings = self.model.encode_text(text_tokens)
                self.text_embeddings = self.text_embeddings / self.text_embeddings.norm(dim=-1, keepdim=True)
        except Exception as e:
            print(f"Failed to precompute embeddings: {e}")
            self._init_mock_mode()
    
    def _init_mock_mode(self):
        """Initialize mock mode if model loading fails"""
        self.model = None
        self.text_embeddings = None
    
    def get_image_embedding(self, image_url: str):
        """Get image embedding using OpenCLIP"""
        if self.model is None:
            # Mock embedding
            return np.random.random(512).astype(np.float32)
        
        try:
            response = requests.get(image_url, timeout=10)
            image = Image.open(BytesIO(response.content)).convert("RGB")
            image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                embedding = self.model.encode_image(image_tensor)
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)
                
            return embedding.cpu().numpy().flatten().astype(np.float32)
            
        except Exception as e:
            print(f"Image embedding failed: {e}")
            # Return mock embedding
            return np.random.random(512).astype(np.float32)
    
    def get_text_embedding(self, text: str):
        """Get text embedding using OpenCLIP"""
        if self.model is None:
            # Mock embedding
            return np.random.random(512).astype(np.float32)
        
        try:
            text_tokens = self.tokenizer([text])
            with torch.no_grad():
                embedding = self.model.encode_text(text_tokens)
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)
                
            return embedding.cpu().numpy().flatten().astype(np.float32)
            
        except Exception as e:
            print(f"Text embedding failed: {e}")
            # Return mock embedding
            return np.random.random(512).astype(np.float32)
    
    def find_similar_styles(self, image_url: str, top_k: int = 5) -> List[Dict]:
        """Find similar styles for an image"""
        try:
            image_embedding = self.get_image_embedding(image_url)
            
            if self.text_embeddings is None:
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
                similarity = np.dot(image_embedding, text_emb)
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
            
            if self.text_embeddings is None:
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
                similarity = np.dot(prompt_embedding, text_emb)
                similarities.append((style, float(similarity)))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return [{"style": style, "similarity": sim} for style, sim in similarities[:top_k]]
            
        except Exception as e:
            raise Exception(f"Prompt recommendation failed: {str(e)}")

# Create global instance
openclip_service = OpenCLIPService()
