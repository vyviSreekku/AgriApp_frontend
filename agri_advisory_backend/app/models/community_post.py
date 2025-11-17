from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)

    likes_count = Column(Integer, nullable=False, default=0)
    comments_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="posts")
    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan")
    images = relationship("CommunityPostImage", back_populates="post", cascade="all, delete-orphan")
