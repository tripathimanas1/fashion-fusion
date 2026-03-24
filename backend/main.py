from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from config import settings
from database import engine
from models import (
    User, Design, SavedDesign, Board, Order, OrderItem,
    Measurement, OrderStatusEnum, OrderStatusModel,
    QuotationRequest, TailorQuote, Tailor, OrderMessage
)

from api import designs, tryon, orders, auth, recommendations, marketplace, quotations, tailor

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix=f"{settings.API_V1_STR}/auth",            tags=["auth"])
app.include_router(designs.router,         prefix=f"{settings.API_V1_STR}/designs",         tags=["designs"])
app.include_router(tryon.router,           prefix=f"{settings.API_V1_STR}/tryon",           tags=["tryon"])
app.include_router(orders.router,          prefix=f"{settings.API_V1_STR}/orders",          tags=["orders"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["recommendations"])
app.include_router(marketplace.router,     prefix=f"{settings.API_V1_STR}/marketplace",     tags=["marketplace"])
app.include_router(quotations.router,      prefix=f"{settings.API_V1_STR}/quotations",      tags=["quotations"])
app.include_router(tailor.router,         prefix=f"{settings.API_V1_STR}/tailor",         tags=["tailor"])

os.makedirs("static/designs", exist_ok=True)
os.makedirs("temp", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "FashionFusion API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
