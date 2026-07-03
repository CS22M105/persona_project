from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.schemas.state import PatientState, StateEvent
from app.schemas.voice import RealtimeSessionResponse
from app.services.scenario_loader import load_copd_sob_scenario
from app.services.state_manager import get_current_state, get_state_events
from app.services.voice_instruction_builder import build_realtime_voice_instructions


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
    state_events = get_state_events()
    request_payload = _build_client_secret_payload(
        scenario=scenario,
        patient_state=patient_state,
        state_events=state_events,
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
    state_events: list[StateEvent],
    settings: Settings,
) -> dict[str, Any]:
    return {
        "session": {
            "type": "realtime",
            "model": settings.openai_realtime_model,
            "instructions": build_realtime_voice_instructions(
                scenario,
                patient_state,
                state_events,
            ),
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
