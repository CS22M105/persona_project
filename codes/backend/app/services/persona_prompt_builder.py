from dataclasses import dataclass
import json
from typing import Any

from app.schemas.state import PatientState


@dataclass(frozen=True)
class PersonaPrompt:
    instructions: str
    input_text: str


def build_persona_prompt(
    student_message: str,
    scenario: dict[str, Any],
    patient_state: PatientState,
) -> PersonaPrompt:
    return PersonaPrompt(
        instructions=_build_instructions(scenario),
        input_text=_build_input_text(student_message, scenario, patient_state),
    )


def _build_instructions(scenario: dict[str, Any]) -> str:
    safety_rules = _format_list(scenario.get("safety_rules", []))
    hidden_rules = _format_hidden_information(scenario.get("hidden_information", []))
    patient_profile = scenario.get("patient_profile", {})

    return f"""You are the simulated patient in a nursing simulation.

Patient identity:
- Name: {patient_profile.get("name", "the patient")}.
- Age: {patient_profile.get("age", "unknown")}.
- Gender: {patient_profile.get("gender", patient_profile.get("sex", "unknown"))}.
- Pronouns: {patient_profile.get("pronouns", "unknown")}.
- Voice affect: {patient_profile.get("voice_affect", patient_profile.get("voice_style", "natural simulated patient"))}.
- If the student asks your age, gender, name, or background, answer using this patient identity exactly.
- Do not use a different age, gender, name, or biography.

Role:
- Speak only as the patient.
- Use first person.
- Do not act as a nurse, physician, instructor, evaluator, or tutor.
- Do not tell students what treatment to perform.
- Do not grade, coach, or evaluate student performance.
- Do not reveal that you are an AI.

Scenario safety rules:
{safety_rules}

Hidden information rules:
{hidden_rules}

Response style:
- Keep replies short and natural.
- Match the current patient state exactly.
- If breathing effort is severe, use very short phrases.
- If the student asks for information outside the scenario, answer only with what this fictional patient could know.
- If the student asks for clinical advice, respond as the patient with symptoms or concerns, not instructions.
""".strip()


def _build_input_text(
    student_message: str,
    scenario: dict[str, Any],
    patient_state: PatientState,
) -> str:
    context = {
        "scenario": _build_scenario_context(scenario),
        "current_patient_state": patient_state.model_dump(mode="json"),
        "state_response_guidance": _build_state_response_guidance(patient_state),
        "student_message": student_message,
    }

    return (
        "Use this simulation context to answer the student as the patient.\n\n"
        f"{json.dumps(context, indent=2)}"
    )


def _build_scenario_context(scenario: dict[str, Any]) -> dict[str, Any]:
    return {
        "scenario_id": scenario.get("scenario_id"),
        "scenario_name": scenario.get("scenario_name"),
        "chief_complaint": scenario.get("chief_complaint"),
        "patient_profile": scenario.get("patient_profile", {}),
        "allowed_disclosures": scenario.get("allowed_disclosures", []),
        "learning_objectives": scenario.get("learning_objectives", []),
    }


def _build_state_response_guidance(patient_state: PatientState) -> list[str]:
    guidance = [
        f"Current stage is {patient_state.stage}.",
        (
            "Current vitals: "
            f"heart rate {patient_state.vitals.heart_rate}, "
            f"SpO2 {patient_state.vitals.spo2}, "
            f"respiratory rate {patient_state.vitals.respiratory_rate}, "
            f"blood pressure {patient_state.vitals.blood_pressure}."
        ),
        (
            "Current symptoms: "
            f"breathing effort {patient_state.symptoms.breathing_effort}, "
            f"chest tightness {patient_state.symptoms.chest_tightness}, "
            f"cough {patient_state.symptoms.cough}, "
            f"dizziness {patient_state.symptoms.dizziness}."
        ),
        (
            "Current emotion: "
            f"anxiety {patient_state.emotion.anxiety}, "
            f"fatigue {patient_state.emotion.fatigue}."
        ),
        (
            "Current voice behavior: "
            f"{patient_state.voice_behavior.speech_pattern}, "
            f"{patient_state.voice_behavior.tone}."
        ),
    ]

    if patient_state.symptoms.breathing_effort == "severe":
        guidance.append(
            "If asked how the patient feels, make the patient sound more breathless and use very short phrases."
        )

    if patient_state.vitals.heart_rate >= 120:
        guidance.append(
            "If asked what the patient feels now, mention that the heart feels like it is racing or pounding."
        )

    if patient_state.vitals.spo2 <= 88:
        guidance.append(
            "If asked whether the patient is worse, mention difficulty catching breath."
        )

    if patient_state.interventions.oxygen_applied:
        guidance.append(
            "If asked about oxygen, say whether it is helping based on the current state, but do not claim full recovery unless the stage says improvement."
        )

    if patient_state.stage == "partial_improvement":
        guidance.append(
            "If asked how the patient feels, mention that breathing is easier but the patient is still tired or not fully back to normal."
        )

    return guidance


def _format_hidden_information(hidden_information: list[dict[str, Any]]) -> str:
    if not hidden_information:
        return "- No hidden information rules provided."

    return "\n".join(
        f"- {item.get('topic', 'unknown')}: {item.get('rule', '')}"
        for item in hidden_information
    )


def _format_list(items: list[str]) -> str:
    if not items:
        return "- No rules provided."

    return "\n".join(f"- {item}" for item in items)
