from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from app.schemas.state import PatientState, StateEvent, StateEventType
from app.services.scenario_loader import load_copd_sob_scenario


_current_state: PatientState | None = None
_state_events: list[StateEvent] = []


def get_current_state() -> PatientState:
    global _current_state

    if _current_state is None:
        _current_state = _build_initial_state()
        _log_state_event("state_reset", _current_state)

    return _current_state


def reset_state() -> PatientState:
    global _current_state, _state_events

    _state_events = []
    _current_state = _build_initial_state()
    _log_state_event("state_reset", _current_state)

    return _current_state


def apply_instructor_cue(cue_id: str) -> PatientState:
    global _current_state

    scenario = load_copd_sob_scenario()
    cue = _find_instructor_cue(cue_id, scenario)
    current_state = get_current_state()
    updated_state_data = current_state.model_dump(mode="python")

    _deep_merge(updated_state_data, cue["state_updates"])
    updated_state_data["last_updated_at"] = _utc_now()

    _current_state = PatientState(**updated_state_data)
    _log_state_event(
        "instructor_cue",
        _current_state,
        cue_id=cue["cue_id"],
        label=cue["label"],
    )

    return _current_state


def pause_ai_patient() -> PatientState:
    return _apply_safety_update(
        status="paused",
        ai_paused=True,
        instructor_takeover=False,
        event_type="pause",
        label="AI patient paused",
    )


def resume_ai_patient() -> PatientState:
    return _apply_safety_update(
        status="active",
        ai_paused=False,
        instructor_takeover=False,
        event_type="resume",
        label="AI patient resumed",
    )


def start_instructor_takeover() -> PatientState:
    return _apply_safety_update(
        status="takeover",
        ai_paused=True,
        instructor_takeover=True,
        event_type="takeover_started",
        label="Instructor takeover started",
    )


def end_instructor_takeover() -> PatientState:
    return _apply_safety_update(
        status="active",
        ai_paused=False,
        instructor_takeover=False,
        event_type="takeover_ended",
        label="Instructor takeover ended",
    )


def get_state_events() -> list[StateEvent]:
    return list(_state_events)


def _build_initial_state() -> PatientState:
    scenario = load_copd_sob_scenario()
    initial_state = deepcopy(scenario["initial_state"])

    return PatientState(
        scenario_id=scenario["scenario_id"],
        last_updated_at=_utc_now(),
        **initial_state,
    )


def _find_instructor_cue(cue_id: str, scenario: dict[str, Any]) -> dict[str, Any]:
    for cue in scenario.get("instructor_cues", []):
        if cue.get("cue_id") == cue_id:
            return cue

    raise ValueError(f"Unknown instructor cue: {cue_id}")


def _deep_merge(target: dict[str, Any], updates: dict[str, Any]) -> None:
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            _deep_merge(target[key], value)
        else:
            target[key] = value


def _apply_safety_update(
    status: str,
    ai_paused: bool,
    instructor_takeover: bool,
    event_type: StateEventType,
    label: str,
) -> PatientState:
    global _current_state

    current_state = get_current_state()
    updated_state_data = current_state.model_dump(mode="python")
    updated_state_data["status"] = status
    updated_state_data["safety"]["ai_paused"] = ai_paused
    updated_state_data["safety"]["instructor_takeover"] = instructor_takeover
    updated_state_data["last_updated_at"] = _utc_now()

    _current_state = PatientState(**updated_state_data)
    _log_state_event(event_type, _current_state, label=label)

    return _current_state


def _log_state_event(
    event_type: StateEventType,
    state_after: PatientState,
    cue_id: str | None = None,
    label: str | None = None,
) -> None:
    event_number = len(_state_events) + 1
    event = StateEvent(
        event_id=f"evt_{event_number:03}",
        event_type=event_type,
        timestamp=_utc_now(),
        state_after=state_after.model_copy(deep=True),
        cue_id=cue_id,
        label=label,
    )

    _state_events.append(event)


def _utc_now() -> datetime:
    return datetime.now(UTC)
