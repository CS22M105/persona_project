from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from typing import Any


DEFAULT_COPD_SOB_AGE = 68
DEFAULT_COPD_SOB_GENDER = "female"
DEFAULT_COPD_SOB_VOICE = "marin"
DEFAULT_COPD_SOB_VOICE_STYLE = "Breathless, tired, anxious"
MIN_PATIENT_AGE = 18
MAX_PATIENT_AGE = 110
ALLOWED_PATIENT_GENDERS = ("female", "male")
ALLOWED_PATIENT_VOICES = (
    "marin",
    "cedar",
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "sage",
    "shimmer",
    "verse",
)
MAX_VOICE_STYLE_LENGTH = 120

_settings_lock = Lock()
_copd_sob_patient_age = DEFAULT_COPD_SOB_AGE
_copd_sob_patient_gender = DEFAULT_COPD_SOB_GENDER
_copd_sob_patient_voice = DEFAULT_COPD_SOB_VOICE
_copd_sob_voice_style = DEFAULT_COPD_SOB_VOICE_STYLE
_copd_sob_settings_updated_at = datetime.now(timezone.utc)


def get_copd_sob_patient_age() -> int:
    with _settings_lock:
        return _copd_sob_patient_age


def get_copd_sob_patient_gender() -> str:
    with _settings_lock:
        return _copd_sob_patient_gender


def get_copd_sob_patient_voice() -> str:
    with _settings_lock:
        return _copd_sob_patient_voice


def get_copd_sob_voice_style() -> str:
    with _settings_lock:
        return _copd_sob_voice_style


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


def update_copd_sob_patient_voice(voice: str) -> str:
    normalized_voice = voice.lower()

    if normalized_voice not in ALLOWED_PATIENT_VOICES:
        allowed_values = ", ".join(ALLOWED_PATIENT_VOICES)
        raise ValueError(f"Patient voice must be one of: {allowed_values}.")

    global _copd_sob_patient_voice, _copd_sob_settings_updated_at
    with _settings_lock:
        _copd_sob_patient_voice = normalized_voice
        _copd_sob_settings_updated_at = datetime.now(timezone.utc)
        return _copd_sob_patient_voice


def update_copd_sob_voice_style(voice_style: str) -> str:
    normalized_voice_style = " ".join(voice_style.strip().split())

    if not normalized_voice_style:
        raise ValueError("Voice style cannot be empty.")

    if len(normalized_voice_style) > MAX_VOICE_STYLE_LENGTH:
        raise ValueError(
            f"Voice style must be {MAX_VOICE_STYLE_LENGTH} characters or fewer."
        )

    global _copd_sob_voice_style, _copd_sob_settings_updated_at
    with _settings_lock:
        _copd_sob_voice_style = normalized_voice_style
        _copd_sob_settings_updated_at = datetime.now(timezone.utc)
        return _copd_sob_voice_style


def apply_copd_sob_persona_settings(scenario: dict[str, Any]) -> dict[str, Any]:
    scenario_with_settings = deepcopy(scenario)
    patient_profile = scenario_with_settings.setdefault("patient_profile", {})
    patient_profile["age"] = get_copd_sob_patient_age()
    patient_profile["gender"] = get_copd_sob_patient_gender()
    patient_profile["sex"] = get_copd_sob_patient_gender()
    patient_profile["pronouns"] = _pronouns_for_gender(get_copd_sob_patient_gender())
    patient_profile["voice"] = get_copd_sob_patient_voice()
    patient_profile["voice_style"] = get_copd_sob_voice_style()
    return scenario_with_settings


def _pronouns_for_gender(gender: str) -> str:
    if gender == "male":
        return "he/him"

    return "she/her"
