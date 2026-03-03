from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    phone: str
    image_url: Optional[str] = None
    location_name: Optional[str] = None
    location_state: Optional[str] = None
    location_district: Optional[str] = None
    weather_alert: bool = True
    pest_alert: bool = True
    market_update: bool = False
    notification_alert: bool = True

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    image_url: Optional[str] = None
    location_name: Optional[str] = None
    location_state: Optional[str] = None
    location_district: Optional[str] = None
    weather_alert: Optional[bool] = None
    pest_alert: Optional[bool] = None
    market_update: Optional[bool] = None
    notification_alert: Optional[bool] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    phone: str
    full_name: Optional[str] = "New User"
    location_district: Optional[str] = None
    location_state: Optional[str] = None
    location_name: Optional[str] = None

