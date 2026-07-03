from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.session import (
    TimelineEventCreate,
    TimelineEventResponse,
    TranscriptMessageCreate,
    TranscriptMessageResponse,
)
from app.schemas.voice import (
    RealtimeSessionResponse,
    VoiceInstructionsResponse,
    VoiceTimelineEventCreateRequest,
    VoiceTranscriptCreateRequest,
)
from app.services.realtime_voice_service import (
    RealtimeVoiceSessionError,
    build_current_voice_instructions,
    create_realtime_voice_session,
)
from app.services.session_service import start_session
from app.services.timeline_service import save_timeline_event
from app.services.transcript_service import save_transcript_message


router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/realtime-session", response_model=RealtimeSessionResponse)
async def create_voice_realtime_session() -> RealtimeSessionResponse:
    try:
        return create_realtime_voice_session()
    except RealtimeVoiceSessionError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.get("/instructions", response_model=VoiceInstructionsResponse)
async def read_current_voice_instructions() -> VoiceInstructionsResponse:
    return build_current_voice_instructions()


@router.post("/transcript", response_model=TranscriptMessageResponse)
async def create_voice_transcript_message(
    request: VoiceTranscriptCreateRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TranscriptMessageResponse:
    session = start_session(db, scenario_id="copd-sob")
    message_type = (
        "student_question" if request.speaker == "student" else "patient_reply"
    )

    return save_transcript_message(
        db,
        TranscriptMessageCreate(
            session_id=session.session_id,
            speaker=request.speaker,
            message_type=message_type,
            text=request.text,
            source="openai_realtime",
        ),
    )


@router.post("/events", response_model=TimelineEventResponse)
async def create_voice_timeline_event(
    request: VoiceTimelineEventCreateRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TimelineEventResponse:
    session = start_session(db, scenario_id="copd-sob")

    return save_timeline_event(
        db,
        TimelineEventCreate(
            session_id=session.session_id,
            event_type=request.event_type,
            label=request.label,
            metadata_json={
                **(request.metadata_json or {}),
                "realtime_session_id": request.realtime_session_id,
            },
        ),
    )
