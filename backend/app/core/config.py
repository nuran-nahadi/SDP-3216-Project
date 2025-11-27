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

    # Supabase Configuration
    supabase_db_url: Optional[str] = None
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    # JWT Configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Server Configuration
    local_url: str = "http://localhost:8000"
    ngrok_url: Optional[str] = None
    use_ngrok: bool = False

    # Cloudinary Configuration
    cloudinary_cloud_name: Optional[str] = None
    cloudinary_api_key: Optional[str] = None
    cloudinary_api_secret: Optional[str] = None

    # AI/ML Configuration (Optional)
    google_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # AI Rate Limiting
    ai_rate_limit_enabled: bool = True
    ai_rate_limit_requests_per_window: int = 2
    ai_rate_limit_window_seconds: int = 60
    daily_update_rate_limit_requests: int = 2
    daily_update_rate_limit_window_seconds: int = 60

    # Email Configuration (Optional)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: Optional[str] = None

    # Development Settings
    debug: bool = False
    log_level: str = "INFO"
    disable_auth: bool = False  # Add this flag

    @property
    def database_url(self) -> str:
        """Build database URL from components or use Supabase URL"""
        if self.supabase_db_url:
            return self.supabase_db_url
        return f"postgresql://{self.db_username}:{self.db_password}@{self.db_hostname}:{self.db_port}/{self.db_name}"

    class Config:
        # Look for .env in the backend directory
        env_file = str(Path(__file__).parent.parent.parent / ".env")
        extra = "forbid"  # This prevents extra fields from being allowed


# Create settings instance
settings = Settings()