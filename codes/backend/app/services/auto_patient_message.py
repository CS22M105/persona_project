from dataclasses import dataclass
from typing import Any
from uuid import uuid4

from app.schemas.session import TranscriptSource
from app.schemas.state import AutoPatientMessage, PatientState


@dataclass(frozen=True)
class AutoPatientMessageResult:
    message: AutoPatientMessage
    source: TranscriptSource


def build_auto_patient_message(
    cue_id: str,
    scenario: dict[str, Any],
    patient_state: PatientState,
) -> AutoPatientMessage:
    return build_auto_patient_message_result(cue_id, scenario, patient_state).message


def build_auto_patient_message_result(
    cue_id: str,
    scenario: dict[str, Any],
    patient_state: PatientState,
) -> AutoPatientMessageResult:
    cue_label = _find_cue_label(cue_id, scenario)
    reaction_text = _build_deterministic_cue_reaction(cue_id, patient_state)

    return AutoPatientMessageResult(
        message=AutoPatientMessage(
            message_id=f"auto-{uuid4()}",
            text=reaction_text,
            cue_id=cue_id,
            cue_label=cue_label,
        ),
        source="system",
    )


def _build_deterministic_cue_reaction(
    cue_id: str,
    patient_state: PatientState,
) -> str:
    reactions = {
        "spo2_dropped": "I feel like I am getting less air. It is harder to breathe.",
        "hr_increased": "My heart feels like it is racing, and I feel more nervous.",
        "breathing_worsened": "I cannot catch my breath. It feels worse right now.",
        "oxygen_applied": "The oxygen is helping a little, but I still feel short of breath.",
        "bronchodilator_given": "My chest feels a little less tight, but I am still working to breathe.",
        "patient_improving": "I am breathing a little easier now. I feel a bit calmer.",
    }

    if cue_id in reactions:
        return reactions[cue_id]

    if patient_state.symptoms.breathing_effort == "severe":
        return "I am having a really hard time breathing right now."

    if patient_state.emotion.anxiety == "high":
        return "I feel very anxious and short of breath."

    return "I feel a change in my breathing right now."


def _find_cue_label(cue_id: str, scenario: dict[str, Any]) -> str | None:
    for cue in scenario.get("instructor_cues", []):
        if cue.get("cue_id") == cue_id:
            return cue.get("label")

    return None
