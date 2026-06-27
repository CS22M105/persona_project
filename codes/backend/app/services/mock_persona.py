from typing import Any


def build_mock_persona_response(message: str, scenario: dict[str, Any]) -> str:
    normalized_message = message.lower()
    disclosures = _get_allowed_disclosures_by_topic(scenario)

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


def _get_allowed_disclosures_by_topic(scenario: dict[str, Any]) -> dict[str, str]:
    allowed_disclosures = scenario.get("allowed_disclosures", [])

    return {
        disclosure["topic"]: disclosure["patient_response"]
        for disclosure in allowed_disclosures
        if "topic" in disclosure and "patient_response" in disclosure
    }


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)
