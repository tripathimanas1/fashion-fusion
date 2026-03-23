from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base  # Single Base shared by all models
from config import settings

# SQLite requires check_same_thread=False; ignored by other drivers
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and guarantees cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables registered against the shared Base.
    Call this from main.py on startup instead of running raw SQL."""
    Base.metadata.create_all(bind=engine)