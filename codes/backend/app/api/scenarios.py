from typing import Any

from fastapi import APIRouter

from app.services.scenario_loader import load_copd_sob_scenario

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/copd-sob")
async def get_copd_sob_scenario() -> dict[str, Any]:
    return load_copd_sob_scenario()
