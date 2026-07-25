"""
LogSense AI - Central Configuration Module
Loads environment variables using python-dotenv and provides validated settings for server, AI, and security.
"""

import os
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Application Version Constant
APP_VERSION = "1.0.0"

# Automatically locate and load .env from backend directory
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


class AppConfig:
    """
    Application-wide environment and deployment settings.
    """
    def __init__(self, validate_on_init: bool = True):
        self.version: str = APP_VERSION
        self.environment: str = os.getenv("ENVIRONMENT", "development").strip().lower()

        raw_port = os.getenv("PORT", "8000")
        try:
            self.port: int = int(raw_port)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid PORT value: '{raw_port}'. Must be an integer.")

        self.host: str = os.getenv("HOST", "0.0.0.0").strip() or "0.0.0.0"
        self.raw_cors_origins: str = os.getenv("CORS_ORIGINS", "").strip()

        if validate_on_init:
            self.validate()

    def validate(self) -> None:
        """Validates general application environment settings."""
        valid_envs = {"development", "production", "testing", "staging"}
        if self.environment not in valid_envs:
            raise ValueError(f"Invalid ENVIRONMENT '{self.environment}'. Must be one of {valid_envs}.")
        if not (1 <= self.port <= 65535):
            raise ValueError(f"Invalid PORT number: {self.port}. Must be between 1 and 65535.")

    def get_cors_origins(self) -> List[str]:
        """Returns list of allowed CORS origins."""
        if not self.raw_cors_origins:
            return [
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
                "http://localhost:8000"
            ]
        if self.raw_cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.raw_cors_origins.split(",") if origin.strip()]


class AIConfig:
    """
    Configuration manager for LogSense AI service settings.
    Supports:
    - OPENAI_API_KEY
    - OPENAI_MODEL
    - OPENAI_MAX_TOKENS
    - OPENAI_TEMPERATURE
    """
    def __init__(self, validate_on_init: bool = True):
        self.api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
        self.model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"



        raw_max_tokens = os.getenv("OPENAI_MAX_TOKENS", "1000")
        try:
            self.max_tokens: int = int(raw_max_tokens)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid OPENAI_MAX_TOKENS value: '{raw_max_tokens}'. Must be an integer.")

        raw_temperature = os.getenv("OPENAI_TEMPERATURE", "0.7")
        try:
            self.temperature: float = float(raw_temperature)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid OPENAI_TEMPERATURE value: '{raw_temperature}'. Must be a float.")

        if validate_on_init:
            self.validate()

    def validate(self) -> None:
        """Validates AI configuration fields."""
        if self.max_tokens <= 0:
            raise ValueError(f"OPENAI_MAX_TOKENS must be greater than 0, got {self.max_tokens}.")
        if not (0.0 <= self.temperature <= 2.0):
            raise ValueError(f"OPENAI_TEMPERATURE must be between 0.0 and 2.0, got {self.temperature}.")

    def is_configured(self) -> bool:
        """
        Returns True if OPENAI_API_KEY is populated and not a placeholder.
        """
        return bool(self.api_key and self.api_key != "your_openai_api_key_here")


def get_app_config() -> AppConfig:
    """Instantiates and returns a validated AppConfig object."""
    return AppConfig(validate_on_init=True)


def get_ai_config() -> AIConfig:
    """Instantiates and returns a validated AIConfig object."""
    return AIConfig(validate_on_init=True)
