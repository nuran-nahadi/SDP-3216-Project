from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    # Database Configuration
    db_username: str
    db_password: str
    db_hostname: str
    db_port: int = 5432
    db_name: str

    # JWT Configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # AI Configuration (Optional)
    google_api_key: Optional[str] = None

    # Development Settings
    disable_auth: bool = False

    @property
    def database_url(self) -> str:
        """Build database URL from components"""
        return f"postgresql://{self.db_username}:{self.db_password}@{self.db_hostname}:{self.db_port}/{self.db_name}"

    class Config:
        # Look for .env in the backend directory
        env_file = str(Path(__file__).parent.parent.parent / ".env")
        extra = "forbid"  # This prevents extra fields from being allowed


# Create settings instance
settings = Settings()
