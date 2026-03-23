"""
Color palette extraction using Pillow + numpy only.
No cv2/opencv dependency — avoids Python 3.13 compatibility issues.
"""
import os
import numpy as np
from PIL import Image
import urllib.request
from typing import List
from sklearn.cluster import KMeans

# Force single-threaded sklearn to avoid Windows pipe errors
os.environ.setdefault("LOKY_MAX_CPU_COUNT", "1")
try:
    from joblib import parallel_config
    parallel_config(backend="sequential")
except Exception:
    pass


class PaletteService:
    def extract_color_palette(self, image_source: str, num_colors: int = 5) -> List[dict]:
        try:
            # Handle both local file paths and HTTP URLs
            if image_source.startswith("http://") or image_source.startswith("https://"):
                import io, requests
                r = requests.get(image_source, timeout=15)
                img = Image.open(io.BytesIO(r.content)).convert("RGB")
            else:
                if not os.path.exists(image_source):
                    raise Exception(f"File not found: {image_source}")
                img = Image.open(image_source).convert("RGB")

            # Resize for speed — 150x150 is enough for color clustering
            img = img.resize((150, 150))
            pixels = np.array(img).reshape(-1, 3).astype(float)

            # KMeans clustering
            kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=5)
            kmeans.fit(pixels)

            colors = kmeans.cluster_centers_.astype(int)
            labels = kmeans.labels_
            _, counts = np.unique(labels, return_counts=True)
            percentages = counts / len(labels)

            palette = []
            for i, color in enumerate(colors):
                r, g, b = int(color[0]), int(color[1]), int(color[2])
                palette.append({
                    "hex": f"#{r:02x}{g:02x}{b:02x}",
                    "rgb": [r, g, b],
                    "percentage": float(percentages[i]) if i < len(percentages) else 0.0
                })

            palette.sort(key=lambda x: x["percentage"], reverse=True)
            return palette

        except Exception as e:
            raise Exception(f"Color palette extraction failed: {str(e)}")

    def get_fabric_recommendations(self, palette: List[dict]) -> List[str]:
        fabrics = []
        for color in palette[:3]:
            brightness = sum(color["rgb"])
            if brightness > 600:
                fabrics.extend(["Cotton", "Linen", "Silk"])
            elif brightness > 400:
                fabrics.extend(["Cotton Blend", "Polyester", "Wool"])
            else:
                fabrics.extend(["Wool", "Velvet", "Denim"])
        return list(set(fabrics))[:5]


palette_service = PaletteService()