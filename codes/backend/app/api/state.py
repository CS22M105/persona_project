from fastapi import APIRouter, HTTPException

from app.schemas.state import PatientStateResponse, StateEventsResponse
from app.services.auto_patient_message import build_auto_patient_message
from app.services.scenario_loader import load_copd_sob_scenario
from app.services.state_manager import (
    apply_instructor_cue,
    get_current_state,
    get_state_events,
    reset_state,
)

router = APIRouter(prefix="/state", tags=["state"])


@router.get("", response_model=PatientStateResponse)
async def read_current_state() -> PatientStateResponse:
    return PatientStateResponse(state=get_current_state())


@router.post("/reset", response_model=PatientStateResponse)
async def reset_current_state() -> PatientStateResponse:
    return PatientStateResponse(state=reset_state())


@router.post("/cues/{cue_id}", response_model=PatientStateResponse)
async def apply_state_cue(cue_id: str) -> PatientStateResponse:
    try:
        updated_state = apply_instructor_cue(cue_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    scenario = load_copd_sob_scenario()
    auto_patient_message = build_auto_patient_message(cue_id, scenario, updated_state)

    return PatientStateResponse(
        state=updated_state,
        auto_patient_message=auto_patient_message,
    )


@router.get("/events", response_model=StateEventsResponse)
async def read_state_events() -> StateEventsResponse:
    return StateEventsResponse(events=get_state_events())
