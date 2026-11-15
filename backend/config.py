import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "DUODO API"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # API Keys
    FEATHERLESS_API_KEY: str = os.getenv("FEATHERLESS_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Supabase PostgreSQL Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Firebase credentials for Token verification
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    # Firebase credentials JSON path (optional, if using service account credentials)
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    # Firebase credentials raw JSON string (used for Render deployment)
    FIREBASE_CREDENTIALS_JSON: str = os.getenv("FIREBASE_CREDENTIALS_JSON", "")

    # Auto-fallback controls
    @property
    def is_db_mocked(self) -> bool:
        return not self.DATABASE_URL
        
    @property
    def is_ai_mocked(self) -> bool:
        return not self.FEATHERLESS_API_KEY and not self.GROQ_API_KEY

settings = Settings()
