from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.mock_persona import build_mock_persona_response
from app.services.scenario_loader import load_copd_sob_scenario
from app.services.state_manager import get_current_state

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def create_chat_response(request: ChatRequest) -> ChatResponse:
    scenario = load_copd_sob_scenario()
    patient_state = get_current_state()
    reply = build_mock_persona_response(request.message, scenario, patient_state)

    return ChatResponse(
        reply=reply,
        scenario_id=scenario["scenario_id"],
    )
