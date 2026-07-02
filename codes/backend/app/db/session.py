from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    session_factory = get_session_factory(get_settings().database_url)

    with session_factory() as session:
        yield session


@lru_cache
def get_session_factory(database_url: str) -> sessionmaker[Session]:
    return sessionmaker(
        bind=get_engine(database_url),
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )


@lru_cache
def get_engine(database_url: str) -> Engine:
    normalized_database_url = _normalize_database_url(database_url)

    return create_engine(
        normalized_database_url,
        connect_args=_get_connect_args(normalized_database_url),
        future=True,
    )


def create_database_tables() -> None:
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=get_engine(get_settings().database_url))


def _get_connect_args(database_url: str) -> dict[str, object]:
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}

    return {}


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    return database_url
