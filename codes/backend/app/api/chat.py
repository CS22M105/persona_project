from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.persona_response_service import build_persona_response
from app.services.scenario_loader import load_copd_sob_scenario
from app.services.state_manager import get_current_state

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def create_chat_response(request: ChatRequest) -> ChatResponse:
    scenario = load_copd_sob_scenario()
    patient_state = get_current_state()
    persona_response = build_persona_response(request.message, scenario, patient_state)

    return ChatResponse(
        reply=persona_response.reply,
        scenario_id=scenario["scenario_id"],
    )
