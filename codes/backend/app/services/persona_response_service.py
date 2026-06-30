import logging
from dataclasses import dataclass
from typing import Any, Literal

from app.schemas.state import PatientState
from app.services.mock_persona import build_mock_persona_response
from app.services.openai_persona import (
    OpenAIPersonaUnavailableError,
    build_openai_persona_response,
)


logger = logging.getLogger(__name__)

PersonaResponseSource = Literal["openai", "mock_fallback"]


@dataclass(frozen=True)
class PersonaResponse:
    reply: str
    source: PersonaResponseSource
    fallback_reason: str | None = None


def build_persona_response(
    message: str,
    scenario: dict[str, Any],
    patient_state: PatientState,
) -> PersonaResponse:
    try:
        reply = build_openai_persona_response(message, scenario, patient_state)

        return PersonaResponse(reply=reply, source="openai")
    except OpenAIPersonaUnavailableError as exc:
        logger.info("Using mock persona fallback: %s", exc)
        fallback_reply = build_mock_persona_response(message, scenario, patient_state)

        return PersonaResponse(
            reply=fallback_reply,
            source="mock_fallback",
            fallback_reason=str(exc),
        )
    except Exception:
        logger.exception("Unexpected persona response error; using mock fallback.")
        fallback_reply = build_mock_persona_response(message, scenario, patient_state)

        return PersonaResponse(
            reply=fallback_reply,
            source="mock_fallback",
            fallback_reason="Unexpected persona response error.",
        )
