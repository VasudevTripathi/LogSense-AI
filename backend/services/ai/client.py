"""
LogSense AI - OpenAI Client Wrapper
Handles API communication, configurable model selection, retries, and exceptions.
Returns raw response metadata and content.
"""

import time
from typing import List, Dict, Any, Optional
from config import AIConfig, get_ai_config

try:
    from openai import OpenAI, APIError, RateLimitError, APIConnectionError, AuthenticationError
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None
    APIError = Exception
    RateLimitError = Exception
    APIConnectionError = Exception
    AuthenticationError = Exception


class OpenAIClientError(Exception):
    """Custom exception for OpenAI API communication failures."""
    pass


class OpenAIClient:
    """
    OpenAI API Client wrapper.
    Responsible for executing completion requests, supporting retries, exception handling,
    and returning raw responses without performing prompt generation.
    """
    def __init__(
        self,
        config: Optional[AIConfig] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        openai_instance: Optional[Any] = None
    ):
        self.config = config or get_ai_config()
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        if openai_instance is not None:
            self._client = openai_instance
        elif OPENAI_AVAILABLE and self.config.is_configured():
            self._client = OpenAI(api_key=self.config.api_key)
        else:
            self._client = None

    def generate_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Sends a completion request to the OpenAI API with retry logic.

        Args:
            messages: List of message dictionaries containing 'role' and 'content'
            model: Optional model override
            temperature: Optional temperature override
            max_tokens: Optional max_tokens override

        Returns:
            Dict containing raw response text, model used, usage token breakdown, and raw object.
        """
        target_model = model or self.config.model
        target_temp = temperature if temperature is not None else self.config.temperature
        target_max_tokens = max_tokens if max_tokens is not None else self.config.max_tokens

        if self._client is None:
            if not self.config.is_configured():
                raise OpenAIClientError("OPENAI_API_KEY is not configured.")
            if not OPENAI_AVAILABLE:
                raise OpenAIClientError("The 'openai' library is not installed.")
            self._client = OpenAI(api_key=self.config.api_key)

        attempt = 0
        last_exception = None

        while attempt < self.max_retries:
            try:
                response = self._client.chat.completions.create(
                    model=target_model,
                    messages=messages,
                    temperature=target_temp,
                    max_tokens=target_max_tokens
                )

                content = ""
                if hasattr(response, "choices") and response.choices:
                    first_choice = response.choices[0]
                    if hasattr(first_choice, "message") and hasattr(first_choice.message, "content"):
                        content = first_choice.message.content or ""
                    elif isinstance(first_choice, dict):
                        content = first_choice.get("message", {}).get("content", "")

                prompt_tokens = 0
                completion_tokens = 0
                total_tokens = 0

                if hasattr(response, "usage") and response.usage:
                    prompt_tokens = getattr(response.usage, "prompt_tokens", 0) or 0
                    completion_tokens = getattr(response.usage, "completion_tokens", 0) or 0
                    total_tokens = getattr(response.usage, "total_tokens", 0) or 0
                elif isinstance(response, dict) and "usage" in response:
                    usage = response["usage"]
                    prompt_tokens = usage.get("prompt_tokens", 0)
                    completion_tokens = usage.get("completion_tokens", 0)
                    total_tokens = usage.get("total_tokens", 0)

                response_model = getattr(response, "model", target_model) or target_model

                return {
                    "content": content,
                    "model_used": response_model,
                    "tokens_used": {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": total_tokens
                    },
                    "raw_response": response
                }

            except AuthenticationError as e:
                raise OpenAIClientError(f"Authentication failed: {str(e)}") from e
            except (RateLimitError, APIConnectionError) as e:
                last_exception = e
                attempt += 1
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay * attempt)
            except APIError as e:
                raise OpenAIClientError(f"OpenAI API Error: {str(e)}") from e
            except Exception as e:
                # Catch custom mocked errors or unexpected issues
                if "Authentication" in str(e) or "401" in str(e):
                    raise OpenAIClientError(f"Authentication failed: {str(e)}") from e
                last_exception = e
                attempt += 1
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay * attempt)

        raise OpenAIClientError(f"API request failed after {self.max_retries} attempts: {str(last_exception)}") from last_exception
