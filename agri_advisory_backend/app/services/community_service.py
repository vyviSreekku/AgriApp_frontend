from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models.community_post import CommunityPost
from ..models.community_post_image import CommunityPostImage
from ..models.community_comment import CommunityComment

# ---------------------------
# CommunityPost CRUD services
# ---------------------------

def create_post(
    db: Session,
    *,
    user_id: int,
    title: str,
    content: str,
    image_urls: Optional[List[str]] = None,
) -> CommunityPost:
    """Create a new community post with optional multiple images."""
    first_image = image_urls[0] if image_urls else None
    print(f"[DEBUG SERVICE] Creating post with {len(image_urls) if image_urls else 0} images")
    post = CommunityPost(
        user_id=user_id,
        title=title,
        content=content,
        image_url=first_image,
    )
    try:
        db.add(post)
        db.commit()
        db.refresh(post)
        print(f"[DEBUG SERVICE] Post created with ID: {post.id}")
        # persist additional images
        if image_urls:
            for url in image_urls:
                img = CommunityPostImage(post_id=post.id, image_url=url)
                db.add(img)
                print(f"[DEBUG SERVICE] Added image: {url}")
            db.commit()
            db.refresh(post)
            print(f"[DEBUG SERVICE] Post {post.id} now has {len(post.images)} images")
        return post
    except Exception:
        db.rollback()
        raise


def get_post(db: Session, post_id: int) -> Optional[CommunityPost]:
    """Retrieve a community post by ID including images and comments."""
    from sqlalchemy.orm import joinedload
    post = (
        db.query(CommunityPost)
        .options(joinedload(CommunityPost.images))
        .options(joinedload(CommunityPost.comments))
        .filter(CommunityPost.id == post_id)
        .first()
    )
    if post:
        print(f"[DEBUG SERVICE] Fetched post {post.id} with {len(post.images)} images")
        for img in post.images:
            print(f"[DEBUG SERVICE]   Image {img.id}: {img.image_url}")
    return post


def list_posts(
    db: Session, *, offset: int = 0, limit: int = 20
) -> List[CommunityPost]:
    """List posts ordered by newest first with pagination."""
    from sqlalchemy.orm import joinedload
    return (
        db.query(CommunityPost)
        .options(joinedload(CommunityPost.images))
        .options(joinedload(CommunityPost.comments))
        .order_by(CommunityPost.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def list_posts_by_user(
    db: Session, *, user_id: int, offset: int = 0, limit: int = 20
) -> List[CommunityPost]:
    """List posts authored by a user."""
    return (
        db.query(CommunityPost)
        .filter(CommunityPost.user_id == user_id)
        .order_by(CommunityPost.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def search_posts(
    db: Session, *, query: str, offset: int = 0, limit: int = 20
) -> List[CommunityPost]:
    """Search posts by title or content (ILIKE)."""
    from sqlalchemy.orm import joinedload
    pattern = f"%{query}%"
    return (
        db.query(CommunityPost)
        .options(joinedload(CommunityPost.images))
        .options(joinedload(CommunityPost.comments))
        .filter(
            or_(
                CommunityPost.title.ilike(pattern),
                CommunityPost.content.ilike(pattern),
            )
        )
        .order_by(CommunityPost.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def update_post(
    db: Session,
    *,
    post_id: int,
    requesting_user_id: int,
    is_admin: bool = False,
    title: Optional[str] = None,
    content: Optional[str] = None,
    image_url: Optional[str] = None,
) -> Optional[CommunityPost]:
    """Update a post (author or admin). Returns updated post or None if not allowed/not found."""
    post = get_post(db, post_id)
    if not post:
        return None
    if not is_admin and post.user_id != requesting_user_id:
        return None

    changed = False
    if title is not None:
        post.title = title
        changed = True
    if content is not None:
        post.content = content
        changed = True
    if image_url is not None:
        post.image_url = image_url
        changed = True

    if not changed:
        return post

    try:
        db.add(post)
        db.commit()
        db.refresh(post)
        return post
    except Exception:
        db.rollback()
        raise


def delete_post(
    db: Session, *, post_id: int, requesting_user_id: int, is_admin: bool = False
) -> bool:
    """Delete a post (author or admin)."""
    post = get_post(db, post_id)
    if not post:
        return False
    if not is_admin and post.user_id != requesting_user_id:
        return False
    try:
        db.delete(post)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise


def increment_likes(
    db: Session, *, post_id: int, delta: int = 1
) -> Optional[int]:
    """Adjust likes_count by delta and return the new value."""
    post = get_post(db, post_id)
    if not post:
        return None
    post.likes_count = max(0, (post.likes_count or 0) + delta)
    try:
        db.add(post)
        db.commit()
        db.refresh(post)
        return post.likes_count
    except Exception:
        db.rollback()
        raise

def create_comment(
    db: Session,
    *,
    post_id: int,
    user_id: int,
    content: str,
) -> Optional[CommunityComment]:
    post = get_post(db, post_id)
    if not post:
        return None
    comment = CommunityComment(post_id=post_id, user_id=user_id, content=content)
    try:
        db.add(comment)
        # maintain a cached counter (optional)
        post.comments_count = (post.comments_count or 0) + 1
        db.add(post)
        db.commit()
        db.refresh(comment)
        return comment
    except Exception:
        db.rollback()
        raise


def list_comments(
    db: Session, *, post_id: int, offset: int = 0, limit: int = 20
) -> List[CommunityComment]:
    return (
        db.query(CommunityComment)
        .filter(CommunityComment.post_id == post_id)
        .order_by(CommunityComment.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def delete_comment(
    db: Session, *, comment_id: int, requesting_user_id: int, is_admin: bool = False
) -> bool:
    comment = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not comment:
        return False
    if not is_admin and comment.user_id != requesting_user_id:
        return False
    try:
        db.delete(comment)
        # decrement cached counter (optional)
        post = get_post(db, comment.post_id)
        if post and (post.comments_count or 0) > 0:
            post.comments_count -= 1
            db.add(post)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
