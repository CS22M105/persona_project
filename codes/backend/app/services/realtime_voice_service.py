import json
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.schemas.state import PatientState
from app.schemas.voice import RealtimeSessionResponse
from app.services.scenario_loader import load_copd_sob_scenario
from app.services.state_manager import get_current_state


class RealtimeVoiceSessionError(RuntimeError):
    pass


def create_realtime_voice_session(
    settings: Settings | None = None,
) -> RealtimeSessionResponse:
    settings = settings or get_settings()

    if settings.openai_api_key in ("", "replace_later"):
        raise RealtimeVoiceSessionError("OpenAI API key is not configured.")

    scenario = load_copd_sob_scenario()
    patient_state = get_current_state()
    request_payload = _build_client_secret_payload(
        scenario=scenario,
        patient_state=patient_state,
        settings=settings,
    )

    try:
        response = httpx.post(
            settings.openai_realtime_client_secret_url,
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
                "OpenAI-Safety-Identifier": "persona-project-local-demo",
            },
            json=request_payload,
            timeout=settings.openai_realtime_request_timeout_seconds,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RealtimeVoiceSessionError(
            "OpenAI Realtime client secret request failed."
        ) from exc

    data = response.json()
    client_secret = data.get("value")

    if not client_secret:
        raise RealtimeVoiceSessionError(
            "OpenAI Realtime response did not include a client secret."
        )

    session = data.get("session") or {}

    return RealtimeSessionResponse(
        client_secret=client_secret,
        expires_at=data["expires_at"],
        session_id=session.get("id"),
        model=settings.openai_realtime_model,
        voice=settings.openai_realtime_voice,
        scenario_id=scenario["scenario_id"],
        connect_url=settings.openai_realtime_connect_url,
    )


def _build_client_secret_payload(
    scenario: dict[str, Any],
    patient_state: PatientState,
    settings: Settings,
) -> dict[str, Any]:
    return {
        "session": {
            "type": "realtime",
            "model": settings.openai_realtime_model,
            "instructions": _build_voice_instructions(scenario, patient_state),
            "output_modalities": ["audio"],
            "audio": {
                "input": {
                    "noise_reduction": {"type": "far_field"},
                    "transcription": {"model": "gpt-realtime-whisper"},
                    "turn_detection": {
                        "type": "server_vad",
                        "create_response": True,
                        "interrupt_response": True,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 700,
                    },
                },
                "output": {
                    "voice": settings.openai_realtime_voice,
                    "speed": 1.0,
                },
            },
            "reasoning": {"effort": "low"},
            "max_output_tokens": 180,
        }
    }


def _build_voice_instructions(
    scenario: dict[str, Any],
    patient_state: PatientState,
) -> str:
    context = {
        "scenario": {
            "scenario_id": scenario.get("scenario_id"),
            "scenario_name": scenario.get("scenario_name"),
            "chief_complaint": scenario.get("chief_complaint"),
            "patient_profile": scenario.get("patient_profile", {}),
            "allowed_disclosures": scenario.get("allowed_disclosures", []),
            "hidden_information": scenario.get("hidden_information", []),
            "safety_rules": scenario.get("safety_rules", []),
        },
        "current_patient_state": patient_state.model_dump(mode="json"),
        "voice_guidance": _build_voice_guidance(patient_state),
    }

    return (
        "You are the simulated patient in a nursing simulation.\n\n"
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
        "- If breathing effort is severe, speak in very short, breathless phrases.\n"
        "- If AI is paused or instructor takeover is active, do not respond as the patient.\n\n"
        "Simulation context:\n"
        f"{json.dumps(context, indent=2)}"
    )


def _build_voice_guidance(patient_state: PatientState) -> list[str]:
    guidance = [
        f"Speech pattern should be {patient_state.voice_behavior.speech_pattern}.",
        f"Tone should be {patient_state.voice_behavior.tone}.",
        f"Breathing effort is {patient_state.symptoms.breathing_effort}.",
        f"Anxiety level is {patient_state.emotion.anxiety}.",
        f"SpO2 is {patient_state.vitals.spo2} percent.",
    ]

    if patient_state.symptoms.breathing_effort == "severe":
        guidance.append("Use short, broken phrases and sound more breathless.")

    if patient_state.vitals.heart_rate >= 120:
        guidance.append("If asked, mention that the heart feels like it is racing.")

    if patient_state.vitals.spo2 <= 88:
        guidance.append("If asked, say it is hard to catch your breath.")

    if patient_state.interventions.oxygen_applied:
        guidance.append("If asked about oxygen, say whether it is helping based on state.")

    if patient_state.stage == "partial_improvement":
        guidance.append("Sound calmer but still tired, not fully recovered.")

    return guidance

