from copy import deepcopy
from threading import Lock
from typing import Any


DEFAULT_COPD_SOB_AGE = 68
DEFAULT_COPD_SOB_GENDER = "female"
MIN_PATIENT_AGE = 18
MAX_PATIENT_AGE = 110
ALLOWED_PATIENT_GENDERS = ("female", "male")

_settings_lock = Lock()
_copd_sob_patient_age = DEFAULT_COPD_SOB_AGE
_copd_sob_patient_gender = DEFAULT_COPD_SOB_GENDER


def get_copd_sob_patient_age() -> int:
    with _settings_lock:
        return _copd_sob_patient_age


def get_copd_sob_patient_gender() -> str:
    with _settings_lock:
        return _copd_sob_patient_gender


def update_copd_sob_patient_age(age: int) -> int:
    if age < MIN_PATIENT_AGE or age > MAX_PATIENT_AGE:
        raise ValueError(
            f"Patient age must be between {MIN_PATIENT_AGE} and {MAX_PATIENT_AGE}."
        )

    global _copd_sob_patient_age
    with _settings_lock:
        _copd_sob_patient_age = age
        return _copd_sob_patient_age


def update_copd_sob_patient_gender(gender: str) -> str:
    normalized_gender = gender.lower()

    if normalized_gender not in ALLOWED_PATIENT_GENDERS:
        allowed_values = ", ".join(ALLOWED_PATIENT_GENDERS)
        raise ValueError(f"Patient gender must be one of: {allowed_values}.")

    global _copd_sob_patient_gender
    with _settings_lock:
        _copd_sob_patient_gender = normalized_gender
        return _copd_sob_patient_gender


def apply_copd_sob_persona_settings(scenario: dict[str, Any]) -> dict[str, Any]:
    scenario_with_settings = deepcopy(scenario)
    patient_profile = scenario_with_settings.setdefault("patient_profile", {})
    patient_profile["age"] = get_copd_sob_patient_age()
    patient_profile["gender"] = get_copd_sob_patient_gender()
    patient_profile["sex"] = get_copd_sob_patient_gender()
    patient_profile["pronouns"] = _pronouns_for_gender(get_copd_sob_patient_gender())
    return scenario_with_settings


def _pronouns_for_gender(gender: str) -> str:
    if gender == "male":
        return "he/him"

    return "she/her"
