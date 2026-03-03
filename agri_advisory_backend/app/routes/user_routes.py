from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import User as UserSchema, UserLogin
from sqlalchemy.future import select

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/login", response_model=UserSchema)
def login_or_register(user_data: UserLogin, db: Session = Depends(get_db)):
    # Check if user exists by phone
    db_user = db.query(User).filter(User.phone == user_data.phone).first()

    if db_user:
        return db_user
    
    # If not registered, create new user
    new_user = User(
        phone=user_data.phone,
        full_name=user_data.full_name or "New User", 
        location_name=user_data.location_name,
        location_district=user_data.location_district,
        location_state=user_data.location_state,
        weather_alert=True,
        pest_alert=True,
        market_update=False,
        notification_alert=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/check/{phone}", response_model=UserSchema)
def check_user_exists(phone: str, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.phone == phone).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
