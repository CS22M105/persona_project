from fastapi import APIRouter, HTTPException

from app.schemas.voice import RealtimeSessionResponse, VoiceInstructionsResponse
from app.services.realtime_voice_service import (
    RealtimeVoiceSessionError,
    build_current_voice_instructions,
    create_realtime_voice_session,
)


router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/realtime-session", response_model=RealtimeSessionResponse)
async def create_voice_realtime_session() -> RealtimeSessionResponse:
    try:
        return create_realtime_voice_session()
    except RealtimeVoiceSessionError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.get("/instructions", response_model=VoiceInstructionsResponse)
async def read_current_voice_instructions() -> VoiceInstructionsResponse:
    return build_current_voice_instructions()
