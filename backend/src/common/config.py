from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    db_user: str
    db_password: str
    db_host: str = "localhost"
    db_port: int = 5433
    db_name: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    finnhub_api_key: str
    finnhub_base_url: str = "https://finnhub.io/api/v1"

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra='ignore'
    )

    # notifications
    notify_backend: str = "console"  # console|smtp

    # SMTP (optional)
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True


settings = Settings()
