from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    app_name: str = "AI Patient Voice Backend"
    frontend_origin: str = "http://localhost:5173"
    database_url: str = "postgresql://persona:persona@localhost:5432/persona_project"
    openai_api_key: str = "replace_later"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
