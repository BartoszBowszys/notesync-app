from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tag import TagOut


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = ""
    tag_ids: list[int] = []


class NoteUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = ""
    tag_ids: list[int] = []


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    tags: list[TagOut] = []
