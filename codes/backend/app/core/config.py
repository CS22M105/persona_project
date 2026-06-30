from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    app_name: str = "AI Patient Voice Backend"
    frontend_origin: str = "http://localhost:5173"
    database_url: str = "postgresql://persona:persona@localhost:5432/persona_project"
    openai_api_key: str = "replace_later"
    openai_text_model: str = "gpt-5.5"
    use_openai_persona: bool = False
    openai_request_timeout_seconds: int = 20
    openai_max_output_tokens: int = 180
    openai_reasoning_effort: str = "low"
    openai_text_verbosity: str = "low"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
