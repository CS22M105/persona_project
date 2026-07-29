from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from typing import Any, TypedDict


DEFAULT_PATIENT_AGE = 68
DEFAULT_PATIENT_GENDER = "female"
DEFAULT_PATIENT_VOICE = "marin"
DEFAULT_VOICE_STYLE = "Breathless, tired, anxious"
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


class PersonaSettings(TypedDict):
    scenario_id: str
    patient_name: str
    age: int
    gender: str
    voice: str
    voice_style: str
    updated_at: datetime


_settings_lock = Lock()
_persona_settings_by_scenario_id: dict[str, PersonaSettings] = {}


def get_persona_settings(
    scenario_id: str,
    scenario: dict[str, Any],
) -> PersonaSettings:
    with _settings_lock:
        return deepcopy(_get_or_create_persona_settings(scenario_id, scenario))


def update_persona_settings(
    scenario_id: str,
    scenario: dict[str, Any],
    *,
    age: int | None = None,
    gender: str | None = None,
    voice: str | None = None,
    voice_style: str | None = None,
) -> PersonaSettings:
    with _settings_lock:
        settings = _get_or_create_persona_settings(scenario_id, scenario)

        if age is not None:
            _validate_age(age)
            settings["age"] = age

        if gender is not None:
            settings["gender"] = _normalize_gender(gender)

        if voice is not None:
            settings["voice"] = _normalize_voice(voice)

        if voice_style is not None:
            settings["voice_style"] = _normalize_voice_style(voice_style)

        settings["updated_at"] = _utc_now()
        return deepcopy(settings)


def apply_persona_settings(scenario: dict[str, Any]) -> dict[str, Any]:
    scenario_with_settings = deepcopy(scenario)
    scenario_id = scenario_with_settings.get("scenario_id", "unknown")
    settings = get_persona_settings(scenario_id, scenario_with_settings)
    patient_profile = scenario_with_settings.setdefault("patient_profile", {})

    patient_profile["age"] = settings["age"]
    patient_profile["gender"] = settings["gender"]
    patient_profile["sex"] = settings["gender"]
    patient_profile["pronouns"] = _pronouns_for_gender(settings["gender"])
    patient_profile["voice"] = settings["voice"]
    patient_profile["voice_affect"] = settings["voice_style"]
    patient_profile["voice_style"] = settings["voice_style"]

    return scenario_with_settings


def apply_copd_sob_persona_settings(scenario: dict[str, Any]) -> dict[str, Any]:
    return apply_persona_settings(scenario)


def get_copd_sob_patient_voice() -> str:
    with _settings_lock:
        settings = _persona_settings_by_scenario_id.get("copd-sob")
        return settings["voice"] if settings else DEFAULT_PATIENT_VOICE


def get_copd_sob_persona_settings_updated_at() -> datetime:
    with _settings_lock:
        settings = _persona_settings_by_scenario_id.get("copd-sob")
        return settings["updated_at"] if settings else _utc_now()


def _get_or_create_persona_settings(
    scenario_id: str,
    scenario: dict[str, Any],
) -> PersonaSettings:
    settings = _persona_settings_by_scenario_id.get(scenario_id)

    if settings is not None:
        return settings

    patient_profile = scenario.get("patient_profile", {})
    settings = PersonaSettings(
        scenario_id=scenario_id,
        patient_name=patient_profile.get("name", "Patient"),
        age=_normalize_age(patient_profile.get("age", DEFAULT_PATIENT_AGE)),
        gender=_normalize_gender(
            patient_profile.get(
                "gender",
                patient_profile.get("sex", DEFAULT_PATIENT_GENDER),
            )
        ),
        voice=_normalize_voice(patient_profile.get("voice", DEFAULT_PATIENT_VOICE)),
        voice_style=_normalize_voice_style(
            patient_profile.get(
                "voice_style",
                patient_profile.get("voice_affect", DEFAULT_VOICE_STYLE),
            )
        ),
        updated_at=_utc_now(),
    )
    _persona_settings_by_scenario_id[scenario_id] = settings
    return settings


def _normalize_age(age: Any) -> int:
    try:
        normalized_age = int(age)
    except (TypeError, ValueError) as error:
        raise ValueError("Patient age must be a whole number.") from error

    _validate_age(normalized_age)
    return normalized_age


def _validate_age(age: int) -> None:
    if age < MIN_PATIENT_AGE or age > MAX_PATIENT_AGE:
        raise ValueError(
            f"Patient age must be between {MIN_PATIENT_AGE} and {MAX_PATIENT_AGE}."
        )


def _normalize_gender(gender: str) -> str:
    normalized_gender = gender.lower()

    if normalized_gender not in ALLOWED_PATIENT_GENDERS:
        allowed_values = ", ".join(ALLOWED_PATIENT_GENDERS)
        raise ValueError(f"Patient gender must be one of: {allowed_values}.")

    return normalized_gender


def _normalize_voice(voice: str) -> str:
    normalized_voice = voice.lower()

    if normalized_voice not in ALLOWED_PATIENT_VOICES:
        allowed_values = ", ".join(ALLOWED_PATIENT_VOICES)
        raise ValueError(f"Patient voice must be one of: {allowed_values}.")

    return normalized_voice


def _normalize_voice_style(voice_style: str) -> str:
    normalized_voice_style = " ".join(voice_style.strip().split())

    if not normalized_voice_style:
        raise ValueError("Voice affect cannot be empty.")

    if len(normalized_voice_style) > MAX_VOICE_STYLE_LENGTH:
        raise ValueError(
            f"Voice affect must be {MAX_VOICE_STYLE_LENGTH} characters or fewer."
        )

    return normalized_voice_style


def _pronouns_for_gender(gender: str) -> str:
    if gender == "male":
        return "he/him"

    return "she/her"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)
