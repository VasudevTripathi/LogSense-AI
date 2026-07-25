"""
LogSense AI - AI Configuration Module
Loads environment variables using python-dotenv and validates AI settings.
"""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Automatically locate and load .env from backend directory
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


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
        """
        Validates configuration fields.
        """
        if self.max_tokens <= 0:
            raise ValueError(f"OPENAI_MAX_TOKENS must be greater than 0, got {self.max_tokens}.")
        if not (0.0 <= self.temperature <= 2.0):
            raise ValueError(f"OPENAI_TEMPERATURE must be between 0.0 and 2.0, got {self.temperature}.")

    def is_configured(self) -> bool:
        """
        Returns True if OPENAI_API_KEY is populated.
        """
        return bool(self.api_key)


def get_ai_config() -> AIConfig:
    """
    Helper function to instantiate and return a validated AIConfig object.
    """
    return AIConfig(validate_on_init=True)
