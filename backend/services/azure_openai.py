"""
Azure OpenAI Service Wrapper

Provides a unified interface for LLM calls.
Falls back to standard OpenAI SDK if Azure credentials aren't configured.
"""

import os
import json
from typing import Any
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI, AsyncOpenAI

# Load environment variables from .env file
load_dotenv()


# Determine which client to use based on environment
def _get_client() -> AsyncAzureOpenAI | AsyncOpenAI:
    """Get the appropriate OpenAI client based on available credentials."""
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    azure_key = os.getenv("AZURE_OPENAI_API_KEY")

    if azure_endpoint and azure_key:
        return AsyncAzureOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=azure_key,
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
        )

    # Fallback to standard OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError(
            "No OpenAI credentials found. Set either:\n"
            "  - AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY (for Azure)\n"
            "  - OPENAI_API_KEY (for standard OpenAI)"
        )

    return AsyncOpenAI(api_key=openai_key)


def _get_model() -> str:
    """Get the model/deployment name to use."""
    # Azure uses deployment names, OpenAI uses model names
    return os.getenv("AZURE_OPENAI_DEPLOYMENT", os.getenv("OPENAI_MODEL", "gpt-4o"))


async def chat_completion(
    messages: list[dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 500,
    json_mode: bool = False,
    **kwargs: Any,
) -> str:
    """
    Send a chat completion request.

    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens in response
        json_mode: If True, request JSON output format
        **kwargs: Additional arguments passed to the API

    Returns:
        The assistant's response text
    """
    client = _get_client()
    model = _get_model()

    request_kwargs: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        **kwargs,
    }

    if json_mode:
        request_kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**request_kwargs)

    return response.choices[0].message.content or ""


async def chat_completion_json(
    messages: list[dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 500,
    **kwargs: Any,
) -> dict:
    """
    Send a chat completion request and parse JSON response.

    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Sampling temperature (0-2)
        max_tokens: Maximum tokens in response
        **kwargs: Additional arguments passed to the API

    Returns:
        Parsed JSON response as a dict

    Raises:
        json.JSONDecodeError: If response is not valid JSON
    """
    response_text = await chat_completion(
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        json_mode=True,
        **kwargs,
    )

    return json.loads(response_text)
