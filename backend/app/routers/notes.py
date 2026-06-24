from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.note import Note
from app.models.tag import Tag
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


def _get_owned_tags(db: Session, owner_id: int, tag_ids: list[int]) -> list[Tag]:
    if not tag_ids:
        return []
    return db.query(Tag).filter(Tag.owner_id == owner_id, Tag.id.in_(tag_ids)).all()


def _get_owned_note(db: Session, note_id: int, owner_id: int) -> Note:
    note = db.query(Note).filter(Note.id == note_id, Note.owner_id == owner_id).first()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.get("", response_model=list[NoteOut])
def list_notes(
    tag: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Note]:
    query = db.query(Note).filter(Note.owner_id == current_user.id)

    if tag:
        query = query.join(Note.tags).filter(Tag.name == tag)

    if search:
        like_pattern = f"%{search}%"
        query = query.filter(or_(Note.title.ilike(like_pattern), Note.content.ilike(like_pattern)))

    return query.order_by(Note.updated_at.desc()).distinct().all()


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = Note(
        title=payload.title,
        content=payload.content,
        owner_id=current_user.id,
        tags=_get_owned_tags(db, current_user.id, payload.tag_ids),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    return _get_owned_note(db, note_id, current_user.id)


@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = _get_owned_note(db, note_id, current_user.id)
    note.title = payload.title
    note.content = payload.content
    note.tags = _get_owned_tags(db, current_user.id, payload.tag_ids)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    note = _get_owned_note(db, note_id, current_user.id)
    db.delete(note)
    db.commit()
