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

    return f"""You are the simulated patient in a nursing simulation.

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
