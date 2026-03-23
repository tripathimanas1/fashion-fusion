import torch
import clip
from PIL import Image
import requests
from typing import List, Tuple
import numpy as np
from io import BytesIO
import sys
import os

# Add CLIP to path if installed from git
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

class CLIPService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        
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
    
    def get_image_embedding(self, image_url: str) -> np.ndarray:
        try:
            response = requests.get(image_url)
            image = Image.open(BytesIO(response.content)).convert("RGB")
            image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                embedding = self.model.encode_image(image_tensor)
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)
                
            return embedding.cpu().numpy().flatten()
            
        except Exception as e:
            raise Exception(f"Image embedding failed: {str(e)}")
    
    def get_text_embedding(self, text: str) -> np.ndarray:
        try:
            text_tokens = clip.tokenize([text]).to(self.device)
            
            with torch.no_grad():
                embedding = self.model.encode_text(text_tokens)
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)
                
            return embedding.cpu().numpy().flatten()
            
        except Exception as e:
            raise Exception(f"Text embedding failed: {str(e)}")
    
    def find_similar_styles(self, image_url: str, top_k: int = 5) -> List[dict]:
        try:
            image_embedding = self.get_image_embedding(image_url)
            
            # Get embeddings for all style prompts
            style_embeddings = []
            for prompt in self.style_prompts:
                embedding = self.get_text_embedding(prompt)
                style_embeddings.append((prompt, embedding))
            
            # Calculate similarities
            similarities = []
            for prompt, style_embedding in style_embeddings:
                similarity = np.dot(image_embedding, style_embedding)
                similarities.append((prompt, float(similarity)))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            return [{"style": style, "similarity": sim} for style, sim in similarities[:top_k]]
            
        except Exception as e:
            raise Exception(f"Style recommendation failed: {str(e)}")
    
    def recommend_from_prompt(self, prompt: str, top_k: int = 5) -> List[dict]:
        try:
            prompt_embedding = self.get_text_embedding(prompt)
            
            # Get embeddings for all style prompts
            style_embeddings = []
            for style_prompt in self.style_prompts:
                embedding = self.get_text_embedding(style_prompt)
                style_embeddings.append((style_prompt, embedding))
            
            # Calculate similarities
            similarities = []
            for style_prompt, style_embedding in style_embeddings:
                similarity = np.dot(prompt_embedding, style_embedding)
                similarities.append((style_prompt, float(similarity)))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            return [{"style": style, "similarity": sim} for style, sim in similarities[:top_k]]
            
        except Exception as e:
            raise Exception(f"Prompt recommendation failed: {str(e)}")

clip_service = CLIPService()
