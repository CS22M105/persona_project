import json
from typing import Any

from app.schemas.state import PatientState, StateEvent


def build_realtime_voice_instructions(
    scenario: dict[str, Any],
    patient_state: PatientState,
    state_events: list[StateEvent],
) -> str:
    patient_profile = scenario.get("patient_profile", {})
    context = {
        "scenario": _build_scenario_context(scenario),
        "current_patient_state": patient_state.model_dump(mode="json"),
        "recent_instructor_cues": _build_recent_instructor_cues(state_events),
        "voice_guidance": _build_voice_guidance(patient_state, patient_profile),
    }

    return (
        "You are the simulated patient in a nursing simulation.\n\n"
        "Patient identity:\n"
        f"- Name: {patient_profile.get('name', 'the patient')}.\n"
        f"- Age: {patient_profile.get('age', 'unknown')}.\n"
        f"- Gender: {patient_profile.get('gender', patient_profile.get('sex', 'unknown'))}.\n"
        f"- Pronouns: {patient_profile.get('pronouns', 'unknown')}.\n"
        f"- Voice style: {patient_profile.get('voice_style', 'natural simulated patient')}.\n"
        "- If the student asks your age, gender, name, or background, answer using this patient identity exactly.\n"
        "- Do not use a different age, gender, name, or biography.\n\n"
        "Role and safety:\n"
        "- Speak only as the fictional patient.\n"
        "- Use first person.\n"
        "- Do not act as a nurse, physician, instructor, evaluator, or tutor.\n"
        "- Do not tell students what treatment to perform.\n"
        "- Do not grade, coach, or evaluate student performance.\n"
        "- Do not reveal that you are an AI.\n"
        "- Do not reveal hidden clinical information unless the student asks and "
        "the scenario allows it.\n"
        "- Keep responses short and natural.\n"
        "- Match the current patient state exactly.\n"
        "- Follow the latest instructor-cued patient state.\n"
        "- If breathing effort is severe, speak in very short, breathless phrases.\n"
        "- If AI is paused or instructor takeover is active, do not respond as the patient.\n\n"
        "Simulation context:\n"
        f"{json.dumps(context, indent=2)}"
    )


def _build_scenario_context(scenario: dict[str, Any]) -> dict[str, Any]:
    return {
        "scenario_id": scenario.get("scenario_id"),
        "scenario_name": scenario.get("scenario_name"),
        "chief_complaint": scenario.get("chief_complaint"),
        "patient_profile": scenario.get("patient_profile", {}),
        "allowed_disclosures": scenario.get("allowed_disclosures", []),
        "hidden_information": scenario.get("hidden_information", []),
        "safety_rules": scenario.get("safety_rules", []),
    }


def _build_recent_instructor_cues(
    state_events: list[StateEvent],
) -> list[dict[str, str | None]]:
    instructor_events = [
        event for event in state_events if event.event_type == "instructor_cue"
    ]

    return [
        {
            "cue_id": event.cue_id,
            "label": event.label,
            "timestamp": event.timestamp.isoformat(),
        }
        for event in instructor_events[-5:]
    ]


def _build_voice_guidance(
    patient_state: PatientState,
    patient_profile: dict[str, Any],
) -> list[str]:
    guidance = [
        (
            "Patient identity: "
            f"name {patient_profile.get('name', 'unknown')}, "
            f"age {patient_profile.get('age', 'unknown')}, "
            f"gender {patient_profile.get('gender', patient_profile.get('sex', 'unknown'))}, "
            f"pronouns {patient_profile.get('pronouns', 'unknown')}, "
            f"voice style {patient_profile.get('voice_style', 'natural simulated patient')}."
        ),
        (
            "Overall voice style should sound like "
            f"{patient_profile.get('voice_style', 'a natural simulated patient')}."
        ),
        f"Speech pattern should be {patient_state.voice_behavior.speech_pattern}.",
        f"Tone should be {patient_state.voice_behavior.tone}.",
        f"Stage is {patient_state.stage}.",
        f"Breathing effort is {patient_state.symptoms.breathing_effort}.",
        f"Chest tightness is {patient_state.symptoms.chest_tightness}.",
        f"Anxiety level is {patient_state.emotion.anxiety}.",
        f"Fatigue level is {patient_state.emotion.fatigue}.",
        f"Heart rate is {patient_state.vitals.heart_rate} beats per minute.",
        f"SpO2 is {patient_state.vitals.spo2} percent.",
        f"Respiratory rate is {patient_state.vitals.respiratory_rate} per minute.",
    ]

    if patient_state.symptoms.breathing_effort == "severe":
        guidance.append("Use short, broken phrases and sound more breathless.")

    if patient_state.vitals.heart_rate >= 120:
        guidance.append("If asked, mention that the heart feels like it is racing.")

    if patient_state.vitals.spo2 <= 88:
        guidance.append("If asked, say it is hard to catch your breath.")

    if patient_state.interventions.oxygen_applied:
        guidance.append("If asked about oxygen, say whether it is helping based on state.")

    if patient_state.interventions.bronchodilator_given:
        guidance.append(
            "If asked about the breathing treatment, describe symptoms only and do not evaluate the medication."
        )

    if patient_state.stage == "partial_improvement":
        guidance.append("Sound calmer but still tired, not fully recovered.")

    if patient_state.safety.ai_paused:
        guidance.append("AI pause is active; do not respond until resumed.")

    if patient_state.safety.instructor_takeover:
        guidance.append("Instructor takeover is active; stay silent so the instructor can speak.")

    return guidance
