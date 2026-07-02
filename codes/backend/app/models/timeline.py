from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.session import utc_now

if TYPE_CHECKING:
    from app.models.session import SimulationSession
    from app.models.transcript import TranscriptMessage


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    event_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.session_id"),
        nullable=False,
        index=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(200), nullable=True)
    cue_id: Mapped[str] = mapped_column(String(80), index=True, nullable=True)
    state_snapshot_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=True)

    session: Mapped["SimulationSession"] = relationship(
        back_populates="timeline_events",
    )
    transcript_messages: Mapped[list["TranscriptMessage"]] = relationship(
        back_populates="state_event",
    )
