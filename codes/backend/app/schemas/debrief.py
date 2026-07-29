from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.session import TimelineEventType


DebriefFramework = Literal["debriefing_with_good_judgment"]
ExpectedActionStatus = Literal["observed", "not_observed", "faculty_review"]


class ExpectedAction(BaseModel):
    action_id: str
    label: str
    evidence_keywords: list[str] = Field(default_factory=list)
    learning_focus: str


class CriticalEventDebriefRule(BaseModel):
    event_type: TimelineEventType
    cue_id: str | None = None
    debrief_focus: str
    advocacy_template: str
    inquiry_template: str
    learning_focus: str


class DebriefConfig(BaseModel):
    framework: DebriefFramework
    faculty_reminder: str
    opening_prompt: str
    expected_actions: list[ExpectedAction] = Field(default_factory=list)
    critical_events: list[CriticalEventDebriefRule] = Field(default_factory=list)
    closing_prompt: str


class ExpectedActionFinding(BaseModel):
    action_id: str
    label: str
    status: ExpectedActionStatus
    matched_evidence: list[str] = Field(default_factory=list)
    learning_focus: str


class DebriefMoment(BaseModel):
    moment_id: str
    title: str
    evidence: list[str] = Field(default_factory=list)
    why_it_matters: str
    advocacy_statement: str
    inquiry_question: str
    learning_focus: str


class GoodJudgmentDebriefGuide(BaseModel):
    framework: DebriefFramework = "debriefing_with_good_judgment"
    faculty_reminder: str
    opening_prompt: str
    expected_action_findings: list[ExpectedActionFinding] = Field(
        default_factory=list,
    )
    debrief_moments: list[DebriefMoment] = Field(default_factory=list)
    closing_prompt: str
