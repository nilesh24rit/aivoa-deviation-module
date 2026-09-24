from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    database_url: str = (
        "postgresql+psycopg://aivoa:aivoa_dev_password@localhost:5433/aivoa_deviation"
    )


settings = Settings()
