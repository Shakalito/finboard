from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    db_user: str
    db_password: str
    db_host: str = "localhost"
    db_port: int = 5433
    db_name: str

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra='ignore'
    )


settings = Settings()

# print(f"DEBUG_CONFIG: DB Host: {settings.db_host}")
# print(f"DEBUG_CONFIG: DB User: {settings.db_user}")
