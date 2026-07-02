from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.transcript import TranscriptMessage
from app.schemas.session import TranscriptMessageCreate
from app.services.session_service import SessionNotFoundError, get_session_by_id


def save_transcript_message(
    db: Session,
    message: TranscriptMessageCreate,
) -> TranscriptMessage:
    _ensure_session_exists(db, message.session_id)

    transcript_message = TranscriptMessage(
        message_id=f"msg-{uuid4()}",
        session_id=message.session_id,
        speaker=message.speaker,
        message_type=message.message_type,
        text=message.text,
        source=message.source,
        cue_id=message.cue_id,
        state_event_id=message.state_event_id,
    )

    db.add(transcript_message)
    db.commit()
    db.refresh(transcript_message)

    return transcript_message


def list_transcript_messages(
    db: Session,
    session_id: str,
) -> list[TranscriptMessage]:
    _ensure_session_exists(db, session_id)

    statement = (
        select(TranscriptMessage)
        .where(TranscriptMessage.session_id == session_id)
        .order_by(TranscriptMessage.timestamp.asc(), TranscriptMessage.message_id.asc())
    )

    return list(db.scalars(statement).all())


def _ensure_session_exists(db: Session, session_id: str) -> None:
    if get_session_by_id(db, session_id) is None:
        raise SessionNotFoundError(f"Session not found: {session_id}")
