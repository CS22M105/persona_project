from datetime import datetime

from pydantic import BaseModel


class ReportSessionMetadata(BaseModel):
    session_id: str
    scenario_id: str
    scenario_name: str
    status: str
    started_at: datetime
    ended_at: datetime | None = None
    transcript_message_count: int
    timeline_event_count: int


class ReportTranscriptEntry(BaseModel):
    timestamp: datetime
    speaker: str
    message_type: str
    text: str


class ReportTimelineEntry(BaseModel):
    timestamp: datetime
    event_type: str
    label: str
    cue_id: str | None = None
    heart_rate: int | None = None
    spo2: int | None = None
    respiratory_rate: int | None = None
    breathing_effort: str | None = None


class ReportChecklistItem(BaseModel):
    item_id: str
    label: str
    review_status: str = "Faculty review"


class FinalDebriefReport(BaseModel):
    report_title: str
    report_length_target: str
    disclaimer: str
    session: ReportSessionMetadata
    summary: str
    transcript_excerpt: list[ReportTranscriptEntry]
    transcript_omitted_count: int
    timeline_excerpt: list[ReportTimelineEntry]
    timeline_omitted_count: int
    assessment_checklist: list[ReportChecklistItem]
    communication_observations: list[str]
    suggested_debrief_prompts: list[str]
    instructor_notes_placeholder: str
