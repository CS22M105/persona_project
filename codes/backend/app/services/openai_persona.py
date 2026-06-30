from typing import Any

from openai import APIError, APITimeoutError, OpenAI

from app.core.config import Settings, get_settings
from app.schemas.state import PatientState
from app.services.persona_prompt_builder import build_persona_prompt


class OpenAIPersonaUnavailableError(RuntimeError):
    pass


def build_openai_persona_response(
    message: str,
    scenario: dict[str, Any],
    patient_state: PatientState,
    settings: Settings | None = None,
) -> str:
    settings = settings or get_settings()

    if not settings.use_openai_persona:
        raise OpenAIPersonaUnavailableError("OpenAI persona is disabled.")

    if settings.openai_api_key in ("", "replace_later"):
        raise OpenAIPersonaUnavailableError("OpenAI API key is not configured.")

    prompt = build_persona_prompt(message, scenario, patient_state)
    client = OpenAI(
        api_key=settings.openai_api_key,
        timeout=settings.openai_request_timeout_seconds,
        max_retries=1,
    )

    try:
        response = client.responses.create(
            model=settings.openai_text_model,
            instructions=prompt.instructions,
            input=prompt.input_text,
            max_output_tokens=settings.openai_max_output_tokens,
            reasoning={"effort": settings.openai_reasoning_effort},
            text={"verbosity": settings.openai_text_verbosity},
            safety_identifier="persona-project-local-demo",
            store=False,
        )
    except (APIError, APITimeoutError) as exc:
        raise OpenAIPersonaUnavailableError("OpenAI persona request failed.") from exc

    reply = response.output_text.strip()

    if not reply:
        raise OpenAIPersonaUnavailableError("OpenAI persona returned an empty reply.")

    return reply
