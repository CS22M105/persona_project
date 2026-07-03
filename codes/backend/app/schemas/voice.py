from pydantic import BaseModel


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
    recent_cue_count: int
