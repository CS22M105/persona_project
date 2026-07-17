from copy import deepcopy
from threading import Lock
from typing import Any


DEFAULT_COPD_SOB_AGE = 68
MIN_PATIENT_AGE = 18
MAX_PATIENT_AGE = 110

_settings_lock = Lock()
_copd_sob_patient_age = DEFAULT_COPD_SOB_AGE


def get_copd_sob_patient_age() -> int:
    with _settings_lock:
        return _copd_sob_patient_age


def update_copd_sob_patient_age(age: int) -> int:
    if age < MIN_PATIENT_AGE or age > MAX_PATIENT_AGE:
        raise ValueError(
            f"Patient age must be between {MIN_PATIENT_AGE} and {MAX_PATIENT_AGE}."
        )

    global _copd_sob_patient_age
    with _settings_lock:
        _copd_sob_patient_age = age
        return _copd_sob_patient_age


def apply_copd_sob_persona_settings(scenario: dict[str, Any]) -> dict[str, Any]:
    scenario_with_settings = deepcopy(scenario)
    patient_profile = scenario_with_settings.setdefault("patient_profile", {})
    patient_profile["age"] = get_copd_sob_patient_age()
    return scenario_with_settings
