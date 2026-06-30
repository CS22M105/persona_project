from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SessionStatus = Literal["not_started", "active", "paused", "takeover", "ended"]
StateEventType = Literal["state_reset", "instructor_cue"]


class Vitals(BaseModel):
    heart_rate: int
    spo2: int
    respiratory_rate: int
    blood_pressure: str


class Symptoms(BaseModel):
    breathing_effort: str
    chest_tightness: str
    cough: str
    dizziness: str


class Emotion(BaseModel):
    anxiety: str
    fatigue: str


class VoiceBehavior(BaseModel):
    speech_pattern: str
    tone: str


class Interventions(BaseModel):
    oxygen_applied: bool
    bronchodilator_given: bool
    provider_notified: bool
    patient_repositioned: bool


class SafetyControls(BaseModel):
    ai_paused: bool = False
    instructor_takeover: bool = False


class PatientState(BaseModel):
    scenario_id: str
    status: SessionStatus = "active"
    stage: str
    vitals: Vitals
    symptoms: Symptoms
    emotion: Emotion
    voice_behavior: VoiceBehavior
    interventions: Interventions
    safety: SafetyControls = Field(default_factory=SafetyControls)
    last_updated_at: datetime


class StateEvent(BaseModel):
    event_id: str
    event_type: StateEventType
    timestamp: datetime
    state_after: PatientState
    cue_id: str | None = None
    label: str | None = None


class AutoPatientMessage(BaseModel):
    message_id: str
    speaker: Literal["patient"] = "patient"
    text: str
    trigger: Literal["instructor_cue"] = "instructor_cue"
    cue_id: str
    cue_label: str | None = None


class PatientStateResponse(BaseModel):
    state: PatientState
    auto_patient_message: AutoPatientMessage | None = None


class StateEventsResponse(BaseModel):
    events: list[StateEvent]
