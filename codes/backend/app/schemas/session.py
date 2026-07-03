from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


PersistedSessionStatus = Literal["active", "paused", "takeover", "ended"]
TranscriptSpeaker = Literal["student", "patient", "system", "instructor"]
TranscriptMessageType = Literal[
    "student_question",
    "patient_reply",
    "auto_patient_reaction",
    "system_note",
]
TranscriptSource = Literal[
    "manual",
    "openai",
    "openai_realtime",
    "mock_fallback",
    "system",
]
TimelineEventType = Literal[
    "session_started",
    "student_message",
    "patient_response",
    "instructor_cue",
    "auto_patient_response",
    "pause",
    "resume",
    "takeover_started",
    "takeover_ended",
    "intervention",
    "voice_connected",
    "voice_disconnected",
    "voice_muted",
    "voice_unmuted",
    "session_ended",
]


class SessionStartRequest(BaseModel):
    scenario_id: str = "copd-sob"


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    scenario_id: str
    status: PersistedSessionStatus
    started_at: datetime
    ended_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CurrentSessionResponse(BaseModel):
    session: SessionResponse | None = None


class TranscriptMessageCreate(BaseModel):
    session_id: str
    speaker: TranscriptSpeaker
    message_type: TranscriptMessageType
    text: str
    source: TranscriptSource
    cue_id: str | None = None
    state_event_id: str | None = None


class TranscriptMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message_id: str
    session_id: str
    timestamp: datetime
    speaker: TranscriptSpeaker
    message_type: TranscriptMessageType
    text: str
    source: TranscriptSource
    cue_id: str | None = None
    state_event_id: str | None = None


class TranscriptResponse(BaseModel):
    session_id: str
    messages: list[TranscriptMessageResponse]


class TimelineEventCreate(BaseModel):
    session_id: str
    event_type: TimelineEventType
    label: str | None = None
    cue_id: str | None = None
    state_snapshot_json: dict[str, Any] | None = None
    metadata_json: dict[str, Any] | None = None


class TimelineEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    session_id: str
    timestamp: datetime
    event_type: TimelineEventType
    label: str | None = None
    cue_id: str | None = None
    state_snapshot_json: dict[str, Any] | None = None
    metadata_json: dict[str, Any] | None = None


class TimelineResponse(BaseModel):
    session_id: str
    events: list[TimelineEventResponse]
