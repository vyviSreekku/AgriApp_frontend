from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import List
import os, secrets
import aiofiles
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.community import (
    CommunityPostCreate,
    CommunityPostUpdate,
    CommunityPostOut,
    CommunityCommentCreate,
    CommunityCommentOut,
)
from ..services import community_service as svc

router = APIRouter(prefix="/community", tags=["community"])

# --------- Posts ---------

@router.post("/posts", response_model=CommunityPostOut)
async def create_post(
    user_id: int = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    print(f"[DEBUG] Received {len(files) if files else 0} files for upload")
    print(f"[DEBUG] Files type: {type(files)}")
    if files:
        for idx, f in enumerate(files):
            print(f"[DEBUG] File {idx}: {f.filename if hasattr(f, 'filename') else 'no filename'}")
    
    image_urls: List[str] = []
    if files:
        allowed = {".jpg", ".jpeg", ".png", ".webp"}
        for f in files:
            print(f"[DEBUG] Processing file: {f.filename}")
            ext = os.path.splitext(f.filename)[1].lower()
            if ext not in allowed:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            uid = secrets.token_hex(12)
            filename = f"post_{uid}{ext}"
            path = os.path.join("media", filename)
            try:
                async with aiofiles.open(path, "wb") as out:
                    data = await f.read()
                    if len(data) > 10 * 1024 * 1024:
                        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
                    await out.write(data)
                image_urls.append(f"/media/{filename}")
                print(f"[DEBUG] Saved image: {filename}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to save image: {e}")
    
    print(f"[DEBUG] Total image_urls: {image_urls}")
    post = svc.create_post(
        db,
        user_id=user_id,
        title=title,
        content=content,
        image_urls=image_urls,
    )
    return post

@router.get("/posts", response_model=list[CommunityPostOut])
def list_posts(
    db: Session = Depends(get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None, description="Search in title/content"),
):
    if q:
        return svc.search_posts(db, query=q, offset=offset, limit=limit)
    return svc.list_posts(db, offset=offset, limit=limit)

@router.get("/posts/{post_id}", response_model=CommunityPostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = svc.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.patch("/posts/{post_id}", response_model=CommunityPostOut)
def update_post(
    post_id: int,
    payload: CommunityPostUpdate,
    db: Session = Depends(get_db),
    requesting_user_id: int = Query(..., description="Author user id or admin"),
    is_admin: bool = Query(False),
):
    post = svc.update_post(
        db,
        post_id=post_id,
        requesting_user_id=requesting_user_id,
        is_admin=is_admin,
        title=payload.title,
        content=payload.content,
        image_url=payload.image_url,
    )
    if not post:
        raise HTTPException(status_code=404, detail="Not found or not allowed")
    return post

@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    requesting_user_id: int = Query(..., description="Author user id or admin"),
    is_admin: bool = Query(False),
):
    ok = svc.delete_post(db, post_id=post_id, requesting_user_id=requesting_user_id, is_admin=is_admin)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found or not allowed")
    return {"ok": True}

@router.post("/posts/{post_id}/like")
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    delta: int = Query(1, description="+1 like, -1 unlike", ge=-1, le=1),
):
    new_count = svc.increment_likes(db, post_id=post_id, delta=delta)
    if new_count is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"likes_count": new_count}

# --------- Comments ---------

@router.post("/posts/{post_id}/comments", response_model=CommunityCommentOut)
def create_comment(
    post_id: int,
    payload: CommunityCommentCreate,
    db: Session = Depends(get_db),
):
    comment = svc.create_comment(db, post_id=post_id, user_id=payload.user_id, content=payload.content)
    if not comment:
        raise HTTPException(status_code=404, detail="Post not found")
    return comment

@router.get("/posts/{post_id}/comments", response_model=list[CommunityCommentOut])
def list_comments(
    post_id: int,
    db: Session = Depends(get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return svc.list_comments(db, post_id=post_id, offset=offset, limit=limit)

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    requesting_user_id: int = Query(...),
    is_admin: bool = Query(False),
):
    ok = svc.delete_comment(db, comment_id=comment_id, requesting_user_id=requesting_user_id, is_admin=is_admin)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found or not allowed")
    return {"ok": True}
