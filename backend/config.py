from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings.
    
    pydantic-settings automatically reads matching env vars, so os.getenv()
    wrappers are unnecessary and have been removed.  Set values in a .env
    file or export them in your shell; the defaults below apply when no env
    var is present.
    """

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FashionFusion"

    # Database
    DATABASE_URL: str = "sqlite:///./fashion_fusion.db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600

    # Security — use one secret for JWT; SECRET_KEY kept for session/cookie use
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET: str = "your-super-secret-jwt-key-here"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Replicate AI (legacy — no longer used)
    REPLICATE_API_TOKEN: str = ""

    # Google AI Studio — 500 free images/day, no credit card
    # Get free key: https://aistudio.google.com/apikey
    GOOGLE_API_KEY: str = ""

    # Virtual try-on (optional)
    TRYON_API_KEY: Optional[str] = None

    # S3-compatible storage
    S3_BUCKET: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = ""
    S3_ENDPOINT: Optional[str] = None

    # CORS — add any additional origins in .env as a JSON list:
    #   BACKEND_CORS_ORIGINS='["https://myapp.com"]'
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return [self.FRONTEND_URL, self.BACKEND_URL]

    # AI model identifiers
    STABLE_DIFFUSION_MODEL: str = "black-forest-labs/flux-dev"
    IMG2IMG_MODEL: str = "black-forest-labs/flux-dev"
    CONTROLNET_MODEL: str = "black-forest-labs/flux-dev"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
