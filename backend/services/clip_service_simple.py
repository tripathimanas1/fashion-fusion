import requests
from typing import List, Dict
import random

class CLIPService:
    def __init__(self):
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
    
    def get_image_embedding(self, image_url: str):
        # Mock implementation - in production would use actual CLIP
        return [random.random() for _ in range(512)]
    
    def get_text_embedding(self, text: str):
        # Mock implementation - in production would use actual CLIP
        return [random.random() for _ in range(512)]
    
    def find_similar_styles(self, image_url: str, top_k: int = 5) -> List[Dict]:
        try:
            # Mock similarity scores for now
            recommendations = []
            random.shuffle(self.style_prompts)
            
            for i, style in enumerate(self.style_prompts[:top_k]):
                similarity = random.uniform(0.6, 0.95)  # Mock similarity scores
                recommendations.append({
                    "style": style,
                    "similarity": similarity
                })
            
            # Sort by similarity
            recommendations.sort(key=lambda x: x['similarity'], reverse=True)
            return recommendations
            
        except Exception as e:
            raise Exception(f"Style recommendation failed: {str(e)}")
    
    def recommend_from_prompt(self, prompt: str, top_k: int = 5) -> List[Dict]:
        try:
            # Mock recommendations based on prompt keywords
            recommendations = []
            random.shuffle(self.style_prompts)
            
            for i, style in enumerate(self.style_prompts[:top_k]):
                similarity = random.uniform(0.7, 0.95)  # Mock similarity scores
                recommendations.append({
                    "style": style,
                    "similarity": similarity
                })
            
            # Sort by similarity
            recommendations.sort(key=lambda x: x['similarity'], reverse=True)
            return recommendations
            
        except Exception as e:
            raise Exception(f"Prompt recommendation failed: {str(e)}")

clip_service = CLIPService()
