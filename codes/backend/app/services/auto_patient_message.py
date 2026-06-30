from typing import Any
from uuid import uuid4

from app.schemas.state import AutoPatientMessage, PatientState
from app.services.persona_response_service import build_persona_response


def build_auto_patient_message(
    cue_id: str,
    scenario: dict[str, Any],
    patient_state: PatientState,
) -> AutoPatientMessage:
    cue_label = _find_cue_label(cue_id, scenario)
    prompt = _build_auto_response_prompt(cue_label)
    persona_response = build_persona_response(prompt, scenario, patient_state)

    return AutoPatientMessage(
        message_id=f"auto-{uuid4()}",
        text=persona_response.reply,
        cue_id=cue_id,
        cue_label=cue_label,
    )


def _build_auto_response_prompt(cue_label: str | None) -> str:
    cue_text = cue_label or "the patient condition changed"

    return (
        "The instructor just changed the simulated patient condition: "
        f"{cue_text}. React spontaneously as the patient right now. "
        "Do not mention the instructor, dashboard, cue, simulation, AI, or vital-sign numbers. "
        "Describe only what you feel or say in the room. "
        "Keep it to one short patient utterance about how you feel now."
    )


def _find_cue_label(cue_id: str, scenario: dict[str, Any]) -> str | None:
    for cue in scenario.get("instructor_cues", []):
        if cue.get("cue_id") == cue_id:
            return cue.get("label")

    return None
