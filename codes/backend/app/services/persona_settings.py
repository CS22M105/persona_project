from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from typing import Any


DEFAULT_COPD_SOB_AGE = 68
DEFAULT_COPD_SOB_GENDER = "female"
MIN_PATIENT_AGE = 18
MAX_PATIENT_AGE = 110
ALLOWED_PATIENT_GENDERS = ("female", "male")
GENDER_VOICE_MAP = {
    "female": "marin",
    "male": "cedar",
}

_settings_lock = Lock()
_copd_sob_patient_age = DEFAULT_COPD_SOB_AGE
_copd_sob_patient_gender = DEFAULT_COPD_SOB_GENDER
_copd_sob_settings_updated_at = datetime.now(timezone.utc)


def get_copd_sob_patient_age() -> int:
    with _settings_lock:
        return _copd_sob_patient_age


def get_copd_sob_patient_gender() -> str:
    with _settings_lock:
        return _copd_sob_patient_gender


def get_copd_sob_patient_voice() -> str:
    with _settings_lock:
        return GENDER_VOICE_MAP.get(_copd_sob_patient_gender, "marin")


def get_copd_sob_persona_settings_updated_at() -> datetime:
    with _settings_lock:
        return _copd_sob_settings_updated_at


def update_copd_sob_patient_age(age: int) -> int:
    if age < MIN_PATIENT_AGE or age > MAX_PATIENT_AGE:
        raise ValueError(
            f"Patient age must be between {MIN_PATIENT_AGE} and {MAX_PATIENT_AGE}."
        )

    global _copd_sob_patient_age, _copd_sob_settings_updated_at
    with _settings_lock:
        _copd_sob_patient_age = age
        _copd_sob_settings_updated_at = datetime.now(timezone.utc)
        return _copd_sob_patient_age


def update_copd_sob_patient_gender(gender: str) -> str:
    normalized_gender = gender.lower()

    if normalized_gender not in ALLOWED_PATIENT_GENDERS:
        allowed_values = ", ".join(ALLOWED_PATIENT_GENDERS)
        raise ValueError(f"Patient gender must be one of: {allowed_values}.")

    global _copd_sob_patient_gender, _copd_sob_settings_updated_at
    with _settings_lock:
        _copd_sob_patient_gender = normalized_gender
        _copd_sob_settings_updated_at = datetime.now(timezone.utc)
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
