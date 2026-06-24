from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.tag import Tag
from app.models.user import User
from app.schemas.tag import TagCreate, TagOut

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Tag]:
    return db.query(Tag).filter(Tag.owner_id == current_user.id).order_by(Tag.name).all()


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Tag:
    existing_tag = (
        db.query(Tag).filter(Tag.owner_id == current_user.id, Tag.name == payload.name).first()
    )
    if existing_tag is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag already exists")

    tag = Tag(name=payload.name, owner_id=current_user.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag
