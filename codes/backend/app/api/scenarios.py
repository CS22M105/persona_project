from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.persona_settings import (
    MAX_PATIENT_AGE,
    MIN_PATIENT_AGE,
    get_copd_sob_patient_age,
    update_copd_sob_patient_age,
)
from app.services.scenario_loader import load_copd_sob_scenario

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


class PersonaSettingsResponse(BaseModel):
    scenario_id: str
    patient_name: str
    age: int


class PersonaSettingsUpdate(BaseModel):
    age: int = Field(..., ge=MIN_PATIENT_AGE, le=MAX_PATIENT_AGE)


@router.get("/copd-sob")
async def get_copd_sob_scenario() -> dict[str, Any]:
    return load_copd_sob_scenario()


@router.get("/copd-sob/persona-settings", response_model=PersonaSettingsResponse)
async def get_copd_sob_persona_settings() -> PersonaSettingsResponse:
    scenario = load_copd_sob_scenario()
    patient_profile = scenario.get("patient_profile", {})

    return PersonaSettingsResponse(
        scenario_id=scenario.get("scenario_id", "copd-sob"),
        patient_name=patient_profile.get("name", "Patient"),
        age=get_copd_sob_patient_age(),
    )


@router.patch("/copd-sob/persona-settings", response_model=PersonaSettingsResponse)
async def update_copd_sob_persona_settings(
    request: PersonaSettingsUpdate,
) -> PersonaSettingsResponse:
    try:
        update_copd_sob_patient_age(request.age)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return await get_copd_sob_persona_settings()
