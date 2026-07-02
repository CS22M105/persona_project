from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SimulationSession(Base):
    __tablename__ = "sessions"

    session_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    scenario_id: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    transcript_messages: Mapped[list["TranscriptMessage"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )
