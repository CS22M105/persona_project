from typing import Any

from app.schemas.state import PatientState


def build_mock_persona_response(
    message: str,
    scenario: dict[str, Any],
    patient_state: PatientState | None = None,
) -> str:
    normalized_message = message.lower()
    disclosures = _get_allowed_disclosures_by_topic(scenario)

    state_response = _build_state_aware_response(normalized_message, patient_state)

    if state_response is not None:
        return state_response

    if _contains_any(normalized_message, ["breath", "breathe", "breathing", "short"]):
        return disclosures.get(
            "onset",
            "The shortness of breath started this morning and has been getting worse.",
        )

    if _contains_any(normalized_message, ["chest", "pain", "tight", "tightness"]):
        return disclosures.get(
            "chest_pain",
            "It is not sharp pain, but my chest feels tight when I try to breathe.",
        )

    if _contains_any(normalized_message, ["oxygen", "o2"]):
        return disclosures.get(
            "home_oxygen",
            "I sometimes use oxygen at night, but I do not usually need it during the day.",
        )

    if _contains_any(normalized_message, ["inhaler", "medication", "medicine", "meds"]):
        return disclosures.get(
            "inhaler_use",
            "I used my rescue inhaler earlier, but it did not help much.",
        )

    if _contains_any(normalized_message, ["smoke", "smoking", "cigarette"]):
        return disclosures.get(
            "smoking_history",
            "I used to smoke, but I quit several years ago.",
        )

    if _contains_any(normalized_message, ["allergy", "allergies", "allergic"]):
        return disclosures.get(
            "allergies",
            "I do not know of any medication allergies.",
        )

    return "I am feeling short of breath and a little scared. Can you help me?"


def _build_state_aware_response(
    normalized_message: str,
    patient_state: PatientState | None,
) -> str | None:
    if patient_state is None:
        return None

    if patient_state.stage == "partial_improvement" and _asks_about_current_feeling(
        normalized_message
    ):
        return "I can breathe a little easier now. I still feel tired."

    if (
        patient_state.vitals.heart_rate >= 120
        and patient_state.emotion.anxiety == "high"
        and _contains_any(normalized_message, ["heart", "feel", "feeling", "now", "scared"])
    ):
        return "My heart feels like it is racing. I feel scared."

    if (
        patient_state.symptoms.breathing_effort == "severe"
        and _asks_about_current_feeling(normalized_message)
    ):
        return "Worse. I cannot catch my breath."

    if (
        patient_state.interventions.oxygen_applied
        and _contains_any(normalized_message, ["oxygen", "o2", "better", "help"])
    ):
        return "The oxygen is on, but I still feel short of breath."

    return None


def _get_allowed_disclosures_by_topic(scenario: dict[str, Any]) -> dict[str, str]:
    allowed_disclosures = scenario.get("allowed_disclosures", [])

    return {
        disclosure["topic"]: disclosure["patient_response"]
        for disclosure in allowed_disclosures
        if "topic" in disclosure and "patient_response" in disclosure
    }


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _asks_about_current_feeling(text: str) -> bool:
    return _contains_any(
        text,
        ["how are you", "feel", "feeling", "now", "worse", "breath", "breathe"],
    )
