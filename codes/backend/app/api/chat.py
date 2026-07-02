from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.session import TranscriptMessageCreate
from app.services.persona_response_service import build_persona_response
from app.services.scenario_loader import load_copd_sob_scenario
from app.services.session_service import start_session
from app.services.state_manager import get_current_state
from app.services.transcript_service import save_transcript_message

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def create_chat_response(
    request: ChatRequest,
    db: Annotated[Session, Depends(get_db)],
) -> ChatResponse:
    scenario = load_copd_sob_scenario()
    session = start_session(db, scenario_id=scenario["scenario_id"])
    save_transcript_message(
        db,
        TranscriptMessageCreate(
            session_id=session.session_id,
            speaker="student",
            message_type="student_question",
            text=request.message,
            source="manual",
        ),
    )

    patient_state = get_current_state()
    persona_response = build_persona_response(request.message, scenario, patient_state)
    save_transcript_message(
        db,
        TranscriptMessageCreate(
            session_id=session.session_id,
            speaker="patient",
            message_type="patient_reply",
            text=persona_response.reply,
            source=persona_response.source,
        ),
    )

    return ChatResponse(
        reply=persona_response.reply,
        scenario_id=scenario["scenario_id"],
    )
