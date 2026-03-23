from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_login import LoginManager
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_db
from models.user import User
from config import settings

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Manager
login_manager = LoginManager(
    token_url="/token",
    secret=settings.JWT_SECRET,
    algorithm="HS256"
)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    location: Optional[str]
    is_designer: bool
    is_tailor: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register new user"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            location=user_data.location,
            is_designer=True,  # Default to designer
            is_tailor=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            phone=new_user.phone,
            location=new_user.location,
            is_designer=new_user.is_designer,
            is_tailor=new_user.is_tailor,
            created_at=new_user.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    try:
        # Authenticate user
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user or not pwd_context.verify(user_data.password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create JWT token
        access_token = login_manager.create_access_token(
            data={"sub": user.email}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(login_manager.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        location=current_user.location,
        is_designer=current_user.is_designer,
        is_tailor=current_user.is_tailor,
        created_at=current_user.created_at
    )

@router.put("/me")
async def update_user_profile(
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    location: Optional[str] = None,
    is_designer: Optional[bool] = None,
    is_tailor: Optional[bool] = None,
    current_user: User = Depends(login_manager.get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        # Update fields if provided
        if full_name is not None:
            current_user.full_name = full_name
        if phone is not None:
            current_user.phone = phone
        if location is not None:
            current_user.location = location
        if is_designer is not None:
            current_user.is_designer = is_designer
        if is_tailor is not None:
            current_user.is_tailor = is_tailor
        
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")
