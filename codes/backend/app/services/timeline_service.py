from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.timeline import TimelineEvent
from app.schemas.session import TimelineEventCreate
from app.services.session_service import SessionNotFoundError, get_session_by_id


def save_timeline_event(
    db: Session,
    event: TimelineEventCreate,
) -> TimelineEvent:
    _ensure_session_exists(db, event.session_id)

    timeline_event = TimelineEvent(
        event_id=f"event-{uuid4()}",
        session_id=event.session_id,
        event_type=event.event_type,
        label=event.label,
        cue_id=event.cue_id,
        state_snapshot_json=event.state_snapshot_json,
        metadata_json=event.metadata_json,
    )

    db.add(timeline_event)
    db.commit()
    db.refresh(timeline_event)

    return timeline_event


def list_timeline_events(
    db: Session,
    session_id: str,
) -> list[TimelineEvent]:
    _ensure_session_exists(db, session_id)

    statement = (
        select(TimelineEvent)
        .where(TimelineEvent.session_id == session_id)
        .order_by(TimelineEvent.timestamp.asc(), TimelineEvent.event_id.asc())
    )

    return list(db.scalars(statement).all())


def _ensure_session_exists(db: Session, session_id: str) -> None:
    if get_session_by_id(db, session_id) is None:
        raise SessionNotFoundError(f"Session not found: {session_id}")
