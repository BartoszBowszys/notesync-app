import os
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config as AlembicConfig
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, notes, tags

BACKEND_DIR = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Railway's dashboard "Start Command" can override railway.toml/Procfile,
    # so migrations are run here on startup instead, gated by an env flag
    # (off by default to keep local dev / pytest unaffected).
    if os.getenv("RUN_MIGRATIONS_ON_STARTUP", "false").lower() == "true":
        alembic_cfg = AlembicConfig(str(BACKEND_DIR / "alembic.ini"))
        command.upgrade(alembic_cfg, "head")
    yield


app = FastAPI(title="NoteSync API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(tags.router)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"name": "NoteSync API", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
