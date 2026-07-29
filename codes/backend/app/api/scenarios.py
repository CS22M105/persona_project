from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.persona_settings import (
    MAX_PATIENT_AGE,
    MAX_VOICE_STYLE_LENGTH,
    MIN_PATIENT_AGE,
    get_copd_sob_patient_age,
    get_copd_sob_patient_gender,
    get_copd_sob_patient_voice,
    get_copd_sob_voice_style,
    update_copd_sob_patient_age,
    update_copd_sob_patient_gender,
    update_copd_sob_patient_voice,
    update_copd_sob_voice_style,
)
from app.services.scenario_loader import (
    ScenarioNotFoundError,
    list_scenarios,
    load_copd_sob_scenario,
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


@router.get("/copd-sob/persona-settings", response_model=PersonaSettingsResponse)
async def get_copd_sob_persona_settings() -> PersonaSettingsResponse:
    scenario = load_copd_sob_scenario()
    patient_profile = scenario.get("patient_profile", {})

    return PersonaSettingsResponse(
        scenario_id=scenario.get("scenario_id", "copd-sob"),
        patient_name=patient_profile.get("name", "Patient"),
        age=get_copd_sob_patient_age(),
        gender=get_copd_sob_patient_gender(),
        voice=get_copd_sob_patient_voice(),
        voice_style=get_copd_sob_voice_style(),
    )


@router.patch("/copd-sob/persona-settings", response_model=PersonaSettingsResponse)
async def update_copd_sob_persona_settings(
    request: PersonaSettingsUpdate,
) -> PersonaSettingsResponse:
    try:
        if request.age is not None:
            update_copd_sob_patient_age(request.age)
        if request.gender is not None:
            update_copd_sob_patient_gender(request.gender)
        if request.voice is not None:
            update_copd_sob_patient_voice(request.voice)
        if request.voice_style is not None:
            update_copd_sob_voice_style(request.voice_style)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return await get_copd_sob_persona_settings()


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
        is_available=card_summary.get("is_available", True),
    )


def _format_scenario_type(clinical_area: str) -> str:
    return f"{clinical_area.replace('_', ' ').title()} scenario"


def _build_default_summary(scenario: dict[str, Any]) -> str:
    chief_complaint = scenario.get("chief_complaint", "a simulated concern")
    return f"Patient encounter focused on {chief_complaint.lower()}"
