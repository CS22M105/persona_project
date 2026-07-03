from fastapi import APIRouter, HTTPException

from app.schemas.voice import RealtimeSessionResponse
from app.services.realtime_voice_service import (
    RealtimeVoiceSessionError,
    create_realtime_voice_session,
)


router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/realtime-session", response_model=RealtimeSessionResponse)
async def create_voice_realtime_session() -> RealtimeSessionResponse:
    try:
        return create_realtime_voice_session()
    except RealtimeVoiceSessionError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

