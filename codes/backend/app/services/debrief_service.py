from app.models.timeline import TimelineEvent
from app.models.transcript import TranscriptMessage
from app.schemas.debrief import (
    DebriefConfig,
    DebriefMoment,
    ExpectedAction,
    ExpectedActionFinding,
    GoodJudgmentDebriefGuide,
)


MAX_MATCHED_EVIDENCE = 3
MAX_EVENT_EVIDENCE = 4


def build_good_judgment_debrief_guide(
    scenario: dict,
    transcript_messages: list[TranscriptMessage],
    timeline_events: list[TimelineEvent],
) -> GoodJudgmentDebriefGuide:
    debrief_config = DebriefConfig.model_validate(scenario["debrief_config"])

    return GoodJudgmentDebriefGuide(
        framework=debrief_config.framework,
        faculty_reminder=debrief_config.faculty_reminder,
        opening_prompt=debrief_config.opening_prompt,
        expected_action_findings=_build_expected_action_findings(
            debrief_config,
            transcript_messages,
        ),
        debrief_moments=_build_debrief_moments(
            debrief_config,
            transcript_messages,
            timeline_events,
        ),
        closing_prompt=debrief_config.closing_prompt,
    )


def _build_expected_action_findings(
    debrief_config: DebriefConfig,
    transcript_messages: list[TranscriptMessage],
) -> list[ExpectedActionFinding]:
    return [
        _build_expected_action_finding(expected_action, transcript_messages)
        for expected_action in debrief_config.expected_actions
    ]


def _build_expected_action_finding(
    expected_action: ExpectedAction,
    transcript_messages: list[TranscriptMessage],
) -> ExpectedActionFinding:
    matched_evidence = _find_student_evidence(
        transcript_messages,
        expected_action.evidence_keywords,
    )

    return ExpectedActionFinding(
        action_id=expected_action.action_id,
        label=expected_action.label,
        status="observed" if matched_evidence else "not_observed",
        matched_evidence=matched_evidence,
        learning_focus=expected_action.learning_focus,
    )


def _build_debrief_moments(
    debrief_config: DebriefConfig,
    transcript_messages: list[TranscriptMessage],
    timeline_events: list[TimelineEvent],
) -> list[DebriefMoment]:
    debrief_moments: list[DebriefMoment] = []

    for rule in debrief_config.critical_events:
        matching_events = [
            event
            for event in timeline_events
            if event.event_type == rule.event_type
            and (rule.cue_id is None or event.cue_id == rule.cue_id)
        ]

        for event in matching_events:
            debrief_moments.append(
                DebriefMoment(
                    moment_id=_build_moment_id(rule.debrief_focus, event.event_id),
                    title=rule.debrief_focus,
                    evidence=_build_event_evidence(event, transcript_messages),
                    why_it_matters=(
                        "This moment can help faculty explore "
                        f"{rule.learning_focus.lower()}."
                    ),
                    advocacy_statement=rule.advocacy_template,
                    inquiry_question=rule.inquiry_template,
                    learning_focus=rule.learning_focus,
                )
            )

    return debrief_moments


def _find_student_evidence(
    transcript_messages: list[TranscriptMessage],
    evidence_keywords: list[str],
) -> list[str]:
    normalized_keywords = [
        keyword.lower().strip() for keyword in evidence_keywords if keyword.strip()
    ]

    if not normalized_keywords:
        return []

    matched_evidence: list[str] = []

    for message in transcript_messages:
        if message.speaker != "student":
            continue

        normalized_text = message.text.lower()

        if any(keyword in normalized_text for keyword in normalized_keywords):
            matched_evidence.append(f'Student: "{_compact_text(message.text)}"')

        if len(matched_evidence) >= MAX_MATCHED_EVIDENCE:
            break

    return matched_evidence


def _build_event_evidence(
    event: TimelineEvent,
    transcript_messages: list[TranscriptMessage],
) -> list[str]:
    evidence = [
        _format_event_evidence(event),
        *_format_state_snapshot_evidence(event),
        *_format_related_patient_messages(event, transcript_messages),
    ]

    return evidence[:MAX_EVENT_EVIDENCE]


def _format_event_evidence(event: TimelineEvent) -> str:
    label = event.label or event.event_type
    return f"Timeline event: {label}."


def _format_state_snapshot_evidence(event: TimelineEvent) -> list[str]:
    state_snapshot = event.state_snapshot_json or {}
    vitals = state_snapshot.get("vitals") or {}
    symptoms = state_snapshot.get("symptoms") or {}
    emotion = state_snapshot.get("emotion") or {}
    interventions = state_snapshot.get("interventions") or {}

    evidence: list[str] = []

    vital_parts = [
        f"HR {vitals['heart_rate']}" if vitals.get("heart_rate") is not None else None,
        f"SpO2 {vitals['spo2']}%" if vitals.get("spo2") is not None else None,
        (
            f"RR {vitals['respiratory_rate']}"
            if vitals.get("respiratory_rate") is not None
            else None
        ),
    ]
    vital_text = ", ".join(part for part in vital_parts if part)

    if vital_text:
        evidence.append(f"Patient state: {vital_text}.")

    if symptoms.get("breathing_effort"):
        evidence.append(
            f"Breathing effort: {symptoms['breathing_effort']}."
        )

    if emotion.get("anxiety"):
        evidence.append(f"Anxiety: {emotion['anxiety']}.")

    intervention_parts = [
        "oxygen applied" if interventions.get("oxygen_applied") else None,
        (
            "bronchodilator given"
            if interventions.get("bronchodilator_given")
            else None
        ),
    ]
    intervention_text = ", ".join(part for part in intervention_parts if part)

    if intervention_text:
        evidence.append(f"Intervention state: {intervention_text}.")

    return evidence


def _format_related_patient_messages(
    event: TimelineEvent,
    transcript_messages: list[TranscriptMessage],
) -> list[str]:
    related_messages: list[str] = []

    for message in transcript_messages:
        if message.speaker != "patient":
            continue

        if message.state_event_id != event.event_id and message.cue_id != event.cue_id:
            continue

        related_messages.append(f'Patient: "{_compact_text(message.text)}"')

        if len(related_messages) >= MAX_MATCHED_EVIDENCE:
            break

    return related_messages


def _build_moment_id(title: str, event_id: str) -> str:
    normalized_title = (
        title.lower()
        .replace("/", " ")
        .replace("-", " ")
        .replace("_", " ")
    )
    title_slug = "_".join(normalized_title.split())
    return f"{title_slug}_{event_id}"


def _compact_text(text: str) -> str:
    normalized_text = " ".join(text.split())

    if len(normalized_text) <= 180:
        return normalized_text

    return f"{normalized_text[:177]}..."
