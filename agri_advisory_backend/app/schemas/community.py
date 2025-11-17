from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CommunityPostBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None

class CommunityPostCreate(CommunityPostBase):
    user_id: int

class CommunityPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None

class CommunityCommentBase(BaseModel):
    content: str

class CommunityCommentCreate(CommunityCommentBase):
    user_id: int
    post_id: int

class CommunityCommentUpdate(BaseModel):
    content: Optional[str] = None

class CommunityCommentOut(CommunityCommentBase):
    id: int
    user_id: int
    post_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CommunityPostImageOut(BaseModel):
    id: int
    image_url: str
    model_config = ConfigDict(from_attributes=True)

class CommunityPostOut(CommunityPostBase):
    id: int
    user_id: int
    created_at: datetime
    likes_count: int | None = 0
    comments_count: int | None = 0
    images: List[CommunityPostImageOut] = []
    comments: List[CommunityCommentOut] = []
    model_config = ConfigDict(from_attributes=True)
