from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = "https://aiczvdicexzwvkqpqncu.supabase.co"
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    supabase_db_url: str = ""
    supabase_region: str = "ap-northeast-1"
    supabase_enable_pgvector: bool = True

    openai_api_key: str = ""
    openai_agent_model: str = "gpt-5.5"
    openai_embedding_model: str = "text-embedding-3-large"
    openai_embedding_fallback_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1024
    openai_transcribe_model: str = "gpt-4o-mini-transcribe"
    openai_transcribe_fallback_model: str = "gpt-4o-transcribe"

    lms_base_url: str = ""
    lms_client_id: str = ""
    lms_client_secret: str = ""
    lms_token_url: str = ""
    lms_webhook_secret: str = ""

    redis_url: str = ""

    adaptlearn_dev_mock_auth: bool = True
    mock_data_retention_days: int = 7
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:3001",
            "http://localhost:3001",
            "http://127.0.0.1:3002",
            "http://localhost:3002",
        ]
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
