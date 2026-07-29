from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.persona_settings import (
    MAX_PATIENT_AGE,
    MAX_VOICE_STYLE_LENGTH,
    MIN_PATIENT_AGE,
    get_persona_settings,
    update_persona_settings,
)
from app.services.scenario_loader import (
    ScenarioNotFoundError,
    list_scenarios,
    load_scenario,
)

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


class PersonaSettingsResponse(BaseModel):
    scenario_id: str
    patient_name: str
    age: int
    gender: str
    voice: str
    voice_style: str


class PersonaSettingsUpdate(BaseModel):
    age: int | None = Field(default=None, ge=MIN_PATIENT_AGE, le=MAX_PATIENT_AGE)
    gender: Literal["female", "male"] | None = None
    voice: Literal[
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
    ] | None = None
    voice_style: str | None = Field(default=None, max_length=MAX_VOICE_STYLE_LENGTH)


class ScenarioSummary(BaseModel):
    scenario_id: str
    scenario_name: str
    status: str
    clinical_area: str
    patient_name: str
    chief_complaint: str
    scenario_type: str
    difficulty: str
    duration: str
    summary: str
    icon: str
    is_available: bool = True


class ScenarioListResponse(BaseModel):
    scenarios: list[ScenarioSummary]


@router.get("", response_model=ScenarioListResponse)
async def get_scenarios() -> ScenarioListResponse:
    return ScenarioListResponse(
        scenarios=[
            _build_scenario_summary(scenario)
            for scenario in list_scenarios()
        ],
    )


@router.get("/{scenario_id}/persona-settings", response_model=PersonaSettingsResponse)
async def get_scenario_persona_settings(
    scenario_id: str,
) -> PersonaSettingsResponse:
    try:
        scenario = load_scenario(scenario_id)
        settings = get_persona_settings(scenario_id, scenario)
    except (ScenarioNotFoundError, ValueError) as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return _build_persona_settings_response(settings)


@router.patch("/{scenario_id}/persona-settings", response_model=PersonaSettingsResponse)
async def update_scenario_persona_settings(
    scenario_id: str,
    request: PersonaSettingsUpdate,
) -> PersonaSettingsResponse:
    try:
        scenario = load_scenario(scenario_id)
        settings = update_persona_settings(
            scenario_id,
            scenario,
            age=request.age,
            gender=request.gender,
            voice=request.voice,
            voice_style=request.voice_style,
        )
    except ScenarioNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return _build_persona_settings_response(settings)


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str) -> dict[str, Any]:
    try:
        return load_scenario(scenario_id)
    except ScenarioNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


def _build_scenario_summary(scenario: dict[str, Any]) -> ScenarioSummary:
    patient_profile = scenario.get("patient_profile", {})
    card_summary = scenario.get("card_summary", {})

    return ScenarioSummary(
        scenario_id=scenario.get("scenario_id", "unknown"),
        scenario_name=scenario.get("scenario_name", "Untitled scenario"),
        status=scenario.get("status", "draft"),
        clinical_area=scenario.get("clinical_area", "general"),
        patient_name=patient_profile.get("name", "Patient"),
        chief_complaint=scenario.get("chief_complaint", "Not specified"),
        scenario_type=card_summary.get(
            "scenario_type",
            _format_scenario_type(scenario.get("clinical_area", "general")),
        ),
        difficulty=card_summary.get("difficulty", "Beginner"),
        duration=card_summary.get("duration", "10-15 min"),
        summary=card_summary.get(
            "summary",
            _build_default_summary(scenario),
        ),
        icon=card_summary.get("icon", "initials"),
        is_available=card_summary.get("is_available", True),
    )


def _build_persona_settings_response(settings: dict[str, Any]) -> PersonaSettingsResponse:
    return PersonaSettingsResponse(
        scenario_id=settings["scenario_id"],
        patient_name=settings["patient_name"],
        age=settings["age"],
        gender=settings["gender"],
        voice=settings["voice"],
        voice_style=settings["voice_style"],
    )


def _format_scenario_type(clinical_area: str) -> str:
    return f"{clinical_area.replace('_', ' ').title()} scenario"


def _build_default_summary(scenario: dict[str, Any]) -> str:
    chief_complaint = scenario.get("chief_complaint", "a simulated concern")
    return f"Patient encounter focused on {chief_complaint.lower()}"
