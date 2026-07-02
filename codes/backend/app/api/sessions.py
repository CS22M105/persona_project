from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.session import (
    CurrentSessionResponse,
    SessionResponse,
    SessionStartRequest,
    TimelineResponse,
    TranscriptResponse,
)
from app.schemas.report import FinalDebriefReport
from app.services.report_service import build_final_debrief_report
from app.services.session_service import (
    SessionNotFoundError,
    end_session,
    get_active_session,
    start_session,
)
from app.services.timeline_service import list_timeline_events
from app.services.transcript_service import list_transcript_messages


router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionResponse)
async def start_simulation_session(
    db: Annotated[Session, Depends(get_db)],
    request: SessionStartRequest = Body(default_factory=SessionStartRequest),
) -> SessionResponse:
    return start_session(db, scenario_id=request.scenario_id)


@router.get("/current", response_model=CurrentSessionResponse)
async def read_current_session(
    db: Annotated[Session, Depends(get_db)],
) -> CurrentSessionResponse:
    return CurrentSessionResponse(session=get_active_session(db))


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_simulation_session(
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> SessionResponse:
    try:
        return end_session(db, session_id)
    except SessionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{session_id}/transcript", response_model=TranscriptResponse)
async def read_session_transcript(
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> TranscriptResponse:
    try:
        messages = list_transcript_messages(db, session_id)
    except SessionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return TranscriptResponse(session_id=session_id, messages=messages)


@router.get("/{session_id}/events", response_model=TimelineResponse)
async def read_session_events(
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> TimelineResponse:
    try:
        events = list_timeline_events(db, session_id)
    except SessionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return TimelineResponse(session_id=session_id, events=events)


@router.get("/{session_id}/report", response_model=FinalDebriefReport)
async def read_session_report(
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> FinalDebriefReport:
    try:
        return build_final_debrief_report(db, session_id)
    except SessionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
