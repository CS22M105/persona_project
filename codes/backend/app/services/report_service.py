from typing import Any

from sqlalchemy.orm import Session

from app.models.timeline import TimelineEvent
from app.models.transcript import TranscriptMessage
from app.schemas.report import (
    FinalDebriefReport,
    ReportChecklistItem,
    ReportSessionMetadata,
    ReportTimelineEntry,
    ReportTranscriptEntry,
)
from app.services.debrief_service import build_good_judgment_debrief_guide
from app.services.scenario_loader import load_scenario
from app.services.session_service import SessionNotFoundError, get_session_by_id
from app.services.timeline_service import list_timeline_events
from app.services.transcript_service import list_transcript_messages


REPORT_DISCLAIMER = (
    "This report is debrief support only. It does not replace faculty judgment."
)
REPORT_LENGTH_TARGET = "Two-page concise faculty debrief report"
INSTRUCTOR_NOTES_PLACEHOLDER = "Instructor notes can be added during faculty debrief."
MAX_TRANSCRIPT_ENTRIES = 12
MAX_TIMELINE_ENTRIES = 8
MAX_OBSERVATIONS = 4
MAX_PROMPTS = 4


def build_final_debrief_report(
    db: Session,
    session_id: str,
) -> FinalDebriefReport:
    session = get_session_by_id(db, session_id)

    if session is None:
        raise SessionNotFoundError(f"Session not found: {session_id}")

    scenario = load_scenario(session.scenario_id)
    transcript_messages = list_transcript_messages(db, session_id)
    timeline_events = list_timeline_events(db, session_id)

    return FinalDebriefReport(
        report_title=_report_title(scenario),
        report_length_target=REPORT_LENGTH_TARGET,
        disclaimer=REPORT_DISCLAIMER,
        session=ReportSessionMetadata(
            session_id=session.session_id,
            scenario_id=session.scenario_id,
            scenario_name=_scenario_name(scenario),
            status=session.status,
            started_at=session.started_at,
            ended_at=session.ended_at,
            transcript_message_count=len(transcript_messages),
            timeline_event_count=len(timeline_events),
        ),
        summary=_build_summary(scenario, transcript_messages, timeline_events),
        transcript_excerpt=_build_transcript_excerpt(transcript_messages),
        transcript_omitted_count=max(0, len(transcript_messages) - MAX_TRANSCRIPT_ENTRIES),
        timeline_excerpt=_build_timeline_excerpt(timeline_events),
        timeline_omitted_count=max(0, len(timeline_events) - MAX_TIMELINE_ENTRIES),
        assessment_checklist=_build_assessment_checklist(scenario),
        communication_observations=_build_communication_observations(
            transcript_messages,
            timeline_events,
        ),
        suggested_debrief_prompts=_build_debrief_prompts(scenario),
        good_judgment_debrief_guide=build_good_judgment_debrief_guide(
            scenario,
            transcript_messages,
            timeline_events,
        ),
        instructor_notes_placeholder=INSTRUCTOR_NOTES_PLACEHOLDER,
    )


def _build_transcript_excerpt(
    transcript_messages: list[TranscriptMessage],
) -> list[ReportTranscriptEntry]:
    return [
        ReportTranscriptEntry(
            timestamp=message.timestamp,
            speaker=message.speaker,
            message_type=message.message_type,
            text=_compact_text(message.text),
            source=message.source,
            cue_id=message.cue_id,
            state_event_id=message.state_event_id,
        )
        for message in transcript_messages[:MAX_TRANSCRIPT_ENTRIES]
    ]


def _build_timeline_excerpt(
    timeline_events: list[TimelineEvent],
) -> list[ReportTimelineEntry]:
    return [
        _build_timeline_entry(event)
        for event in timeline_events[:MAX_TIMELINE_ENTRIES]
    ]


def _build_assessment_checklist(
    scenario: dict[str, Any],
) -> list[ReportChecklistItem]:
    checklist_items = scenario.get("assessment_checklist", [])

    return [
        ReportChecklistItem(
            item_id=item.get("item_id", "unknown"),
            label=item.get("label", "Faculty review item"),
        )
        for item in checklist_items
    ]


def _build_summary(
    scenario: dict[str, Any],
    transcript_messages: list[TranscriptMessage],
    timeline_events: list[TimelineEvent],
) -> str:
    student_message_count = sum(
        1 for message in transcript_messages if message.speaker == "student"
    )
    patient_message_count = sum(
        1 for message in transcript_messages if message.speaker == "patient"
    )
    cue_count = sum(1 for event in timeline_events if event.event_type == "instructor_cue")

    return (
        f"The session used the {_scenario_name(scenario)} scenario. "
        f"The record includes {student_message_count} student message(s), "
        f"{patient_message_count} AI patient response(s), and {cue_count} "
        "instructor-cued patient state change(s). Patient responses followed the "
        "latest instructor-controlled state."
    )


def _build_timeline_entry(event: TimelineEvent) -> ReportTimelineEntry:
    state_snapshot = event.state_snapshot_json or {}
    vitals = state_snapshot.get("vitals") or {}
    symptoms = state_snapshot.get("symptoms") or {}
    emotion = state_snapshot.get("emotion") or {}
    interventions = state_snapshot.get("interventions") or {}

    return ReportTimelineEntry(
        timestamp=event.timestamp,
        event_type=event.event_type,
        label=event.label or event.event_type,
        cue_id=event.cue_id,
        heart_rate=vitals.get("heart_rate"),
        spo2=vitals.get("spo2"),
        respiratory_rate=vitals.get("respiratory_rate"),
        breathing_effort=symptoms.get("breathing_effort"),
        anxiety=emotion.get("anxiety"),
        oxygen_applied=interventions.get("oxygen_applied"),
        bronchodilator_given=interventions.get("bronchodilator_given"),
    )


def _build_communication_observations(
    transcript_messages: list[TranscriptMessage],
    timeline_events: list[TimelineEvent],
) -> list[str]:
    observations: list[str] = []
    student_text = " ".join(
        message.text.lower()
        for message in transcript_messages
        if message.speaker == "student"
    )

    if student_text:
        observations.append(
            "Learner communication included patient assessment or follow-up questions."
        )

    if any(term in student_text for term in ("feel", "feeling", "anxious", "scared")):
        observations.append(
            "Learner communication included patient comfort or emotional-status language."
        )

    if any(
        _snapshot_value(event, "emotion", "anxiety") == "high"
        for event in timeline_events
    ):
        observations.append(
            "The patient state included high anxiety; faculty can discuss calming communication."
        )

    if any(event.event_type == "instructor_cue" for event in timeline_events):
        observations.append(
            "Instructor cues changed the patient state; faculty can review how learners reassessed after changes."
        )

    if not observations:
        observations.append(
            "No specific communication pattern was detected in the short transcript excerpt."
        )

    return observations[:MAX_OBSERVATIONS]


def _build_debrief_prompts(scenario: dict[str, Any]) -> list[str]:
    prompts: list[str] = []

    for objective in scenario.get("learning_objectives", [])[:2]:
        prompts.append(f"How did the team address this objective: {objective}?")

    for rule in scenario.get("debrief_config", {}).get("critical_events", [])[:2]:
        inquiry_template = rule.get("inquiry_template")

        if inquiry_template:
            prompts.append(inquiry_template)

    prompts.append(
        "What patient changes or communication cues would you reassess before ending the encounter?"
    )

    return prompts[:MAX_PROMPTS]


def _snapshot_value(event: TimelineEvent, section: str, key: str) -> Any:
    state_snapshot = event.state_snapshot_json or {}
    section_values = state_snapshot.get(section) or {}
    return section_values.get(key)


def _scenario_name(scenario: dict[str, Any]) -> str:
    return scenario.get("scenario_name", "Simulation Scenario")


def _report_title(scenario: dict[str, Any]) -> str:
    return f"{_scenario_name(scenario)} Debrief Report"


def _compact_text(text: str) -> str:
    normalized_text = " ".join(text.split())

    if len(normalized_text) <= 220:
        return normalized_text

    return f"{normalized_text[:217]}..."
