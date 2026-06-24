from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://notesync:notesync@localhost:5432/notesync"
    secret_key: str = "change-this-secret-in-production"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://localhost:19006"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
