from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.session import utc_now

if TYPE_CHECKING:
    from app.models.session import SimulationSession
    from app.models.timeline import TimelineEvent


class TranscriptMessage(Base):
    __tablename__ = "transcript_messages"

    message_id: Mapped[str] = mapped_column(String(80), primary_key=True)
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
    speaker: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    message_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    cue_id: Mapped[str] = mapped_column(String(80), index=True, nullable=True)
    state_event_id: Mapped[str] = mapped_column(
        ForeignKey("timeline_events.event_id"),
        index=True,
        nullable=True,
    )

    session: Mapped["SimulationSession"] = relationship(
        back_populates="transcript_messages",
    )
    state_event: Mapped["TimelineEvent"] = relationship(
        back_populates="transcript_messages",
    )
