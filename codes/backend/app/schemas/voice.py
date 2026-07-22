from typing import Literal

from pydantic import BaseModel

from app.schemas.session import TimelineEventType


class RealtimeSessionResponse(BaseModel):
    client_secret: str
    expires_at: int
    session_id: str | None = None
    model: str
    voice: str
    scenario_id: str
    connect_url: str


class VoiceInstructionsResponse(BaseModel):
    instructions: str
    scenario_id: str
    patient_state_updated_at: str
    persona_settings_updated_at: str
    recent_cue_count: int


class VoiceTranscriptCreateRequest(BaseModel):
    speaker: Literal["student", "patient"]
    text: str
    realtime_event_type: str | None = None


class VoiceTimelineEventCreateRequest(BaseModel):
    event_type: TimelineEventType
    label: str
    realtime_session_id: str | None = None
    metadata_json: dict[str, str | int | bool | None] | None = None
