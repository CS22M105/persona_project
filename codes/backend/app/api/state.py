from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.session import (
    TimelineEventCreate,
    TimelineEventType,
    TranscriptMessageCreate,
)
from app.schemas.state import PatientStateResponse, StateEventsResponse
from app.services.auto_patient_message import build_auto_patient_message_result
from app.services.scenario_loader import load_copd_sob_scenario
from app.services.session_service import start_session
from app.services.state_manager import (
    apply_instructor_cue,
    end_instructor_takeover,
    get_current_state,
    get_state_events,
    pause_ai_patient,
    reset_state,
    resume_ai_patient,
    start_instructor_takeover,
)
from app.services.timeline_service import save_timeline_event
from app.services.transcript_service import save_transcript_message

router = APIRouter(prefix="/state", tags=["state"])


@router.get("", response_model=PatientStateResponse)
async def read_current_state() -> PatientStateResponse:
    return PatientStateResponse(state=get_current_state())


@router.post("/reset", response_model=PatientStateResponse)
async def reset_current_state() -> PatientStateResponse:
    return PatientStateResponse(state=reset_state())


@router.post("/cues/{cue_id}", response_model=PatientStateResponse)
async def apply_state_cue(
    cue_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> PatientStateResponse:
    try:
        updated_state = apply_instructor_cue(cue_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    scenario = load_copd_sob_scenario()
    session = start_session(db, scenario_id=scenario["scenario_id"])
    state_snapshot = updated_state.model_dump(mode="json")
    cue_event = save_timeline_event(
        db,
        TimelineEventCreate(
            session_id=session.session_id,
            event_type="instructor_cue",
            label=_find_cue_label(cue_id, scenario),
            cue_id=cue_id,
            state_snapshot_json=state_snapshot,
            metadata_json={"source": "instructor_dashboard"},
        ),
    )
    auto_patient_message_result = build_auto_patient_message_result(
        cue_id,
        scenario,
        updated_state,
    )
    auto_patient_message = auto_patient_message_result.message
    saved_auto_message = save_transcript_message(
        db,
        TranscriptMessageCreate(
            session_id=session.session_id,
            speaker="patient",
            message_type="auto_patient_reaction",
            text=auto_patient_message.text,
            source=auto_patient_message_result.source,
            cue_id=cue_id,
            state_event_id=cue_event.event_id,
        ),
    )
    save_timeline_event(
        db,
        TimelineEventCreate(
            session_id=session.session_id,
            event_type="auto_patient_response",
            label="Automatic patient response",
            cue_id=cue_id,
            state_snapshot_json=state_snapshot,
            metadata_json={
                "message_id": saved_auto_message.message_id,
                "source": auto_patient_message_result.source,
            },
        ),
    )

    return PatientStateResponse(
        state=updated_state,
        auto_patient_message=auto_patient_message,
    )


@router.post("/safety/pause", response_model=PatientStateResponse)
async def pause_current_ai_patient(
    db: Annotated[Session, Depends(get_db)],
) -> PatientStateResponse:
    updated_state = pause_ai_patient()
    _save_safety_timeline_event(db, "pause", "AI patient paused", updated_state)

    return PatientStateResponse(state=updated_state)


@router.post("/safety/resume", response_model=PatientStateResponse)
async def resume_current_ai_patient(
    db: Annotated[Session, Depends(get_db)],
) -> PatientStateResponse:
    updated_state = resume_ai_patient()
    _save_safety_timeline_event(db, "resume", "AI patient resumed", updated_state)

    return PatientStateResponse(state=updated_state)


@router.post("/safety/takeover/start", response_model=PatientStateResponse)
async def start_current_instructor_takeover(
    db: Annotated[Session, Depends(get_db)],
) -> PatientStateResponse:
    updated_state = start_instructor_takeover()
    _save_safety_timeline_event(
        db,
        "takeover_started",
        "Instructor takeover started",
        updated_state,
    )

    return PatientStateResponse(state=updated_state)


@router.post("/safety/takeover/end", response_model=PatientStateResponse)
async def end_current_instructor_takeover(
    db: Annotated[Session, Depends(get_db)],
) -> PatientStateResponse:
    updated_state = end_instructor_takeover()
    _save_safety_timeline_event(
        db,
        "takeover_ended",
        "Instructor takeover ended",
        updated_state,
    )

    return PatientStateResponse(state=updated_state)


@router.get("/events", response_model=StateEventsResponse)
async def read_state_events() -> StateEventsResponse:
    return StateEventsResponse(events=get_state_events())


def _find_cue_label(cue_id: str, scenario: dict) -> str | None:
    for cue in scenario.get("instructor_cues", []):
        if cue.get("cue_id") == cue_id:
            return cue.get("label")

    return None


def _save_safety_timeline_event(
    db: Session,
    event_type: TimelineEventType,
    label: str,
    updated_state,
) -> None:
    scenario = load_copd_sob_scenario()
    session = start_session(db, scenario_id=scenario["scenario_id"])

    save_timeline_event(
        db,
        TimelineEventCreate(
            session_id=session.session_id,
            event_type=event_type,
            label=label,
            state_snapshot_json=updated_state.model_dump(mode="json"),
            metadata_json={"source": "voice_safety_control"},
        ),
    )
