from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class CommunityPostImage(Base):
    __tablename__ = "community_post_images"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), index=True, nullable=False)
    image_url = Column(String(255), nullable=False)

    post = relationship("CommunityPost", back_populates="images")
