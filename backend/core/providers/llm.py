from __future__ import annotations

import json
import re
from typing import TypeVar
import httpx
from pydantic import BaseModel
from ..config import settings
from ..interfaces import LLMProvider
from ..logging import logger

T = TypeVar("T", bound=BaseModel)


class MockLLMProvider(LLMProvider):
    """
    Deterministic mock LLM provider for tests and offline development.
    Simulates grounded RAG responses, citation outputs, and 'answer not found' cases.
    """

    def __init__(self, model: str = "mock-planetary-assistant"):
        self.model = model

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> str:
        prompt_lower = prompt.lower()

        # Case 1: Unanswerable query / prompt asking for nonexistent topic
        if any(unfound in prompt_lower for unfound in ["venus", "titan methane oceans", "europa ice depth", "not_found_query"]):
            return "The provided sources do not contain information to answer this question."

        # Case 2: Query about Jezero / temperature / pressure
        if "jezero" in prompt_lower or "temperature" in prompt_lower or "pressure" in prompt_lower:
            # Look for chunk id in prompt context
            chunk_match = re.search(r"\[CHUNK\s+([a-zA-Z0-9\-]+)\s*\|\s*Page\s*(\d+)", prompt)
            chunk_id = chunk_match.group(1) if chunk_match else "chk-mock-1"
            page_num = chunk_match.group(2) if chunk_match else "1"

            # Check if prompt contains the text of Jezero Crater
            if "215 k" in prompt_lower:
                return (
                    f"The mean surface temperature of Jezero crater is recorded at 215 K with diurnal fluctuations "
                    f"between 180 K and 255 K [citation:{chunk_id}:{page_num}:mean surface temperature of 215 K]. "
                    f"Surface pressure is 6.1 mbar predominantly composed of carbon dioxide [citation:{chunk_id}:{page_num}:pressure is recorded at 6.1 mbar]."
                )

        # Case 3: Query about Svalbard terrestrial gullies
        if "svalbard" in prompt_lower or "gullies" in prompt_lower:
            chunk_match = re.search(r"\[CHUNK\s+([a-zA-Z0-9\-]+)\s*\|\s*Page\s*(\d+)", prompt)
            chunk_id = chunk_match.group(1) if chunk_match else "chk-mock-2"
            page_num = chunk_match.group(2) if chunk_match else "1"
            return (
                f"Terrestrial gullies on Svalbard serve as high-fidelity planetary analogs for Martian slope features "
                f"[citation:{chunk_id}:{page_num}:gullies on Svalbard as planetary analogs for Mars]. "
                f"Fluvial erosion is driven primarily by spring snowmelt."
            )

        # Default fallback if context exists
        if "<context>" in prompt:
            chunk_match = re.search(r"\[CHUNK\s+([a-zA-Z0-9\-]+)\s*\|\s*Page\s*(\d+)", prompt)
            if chunk_match:
                c_id = chunk_match.group(1)
                p_num = chunk_match.group(2)
                # Find first short sentence inside context
                context_part = prompt.split("<context>")[1].split("</context>")[0]
                lines = [line.strip() for line in context_part.splitlines() if line.strip() and not line.startswith("[CHUNK")]
                if lines:
                    sample_quote = lines[0][:40]
                    return f"Based on retrieved evidence, the analog environment displays relevant properties [citation:{c_id}:{p_num}:{sample_quote}]."

        return "The provided sources do not contain information to answer this question."

    def extract_structured(
        self,
        prompt: str,
        schema: type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0,
    ) -> T:
        try:
            return schema.model_validate({})
        except Exception:
            raise ValueError(f"MockLLM cannot automatically construct empty {schema.__name__}")


class GeminiLLMProvider(LLMProvider):
    """Google Gemini API Provider (e.g. gemini-2.5-flash)."""

    def __init__(self, api_key: str | None = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model
        if not self.api_key:
            logger.warning("GeminiLLMProvider initialized without GEMINI_API_KEY")

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in .env")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTION: {system_prompt}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens or 2048,
            },
        }

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return "The provided sources do not contain information to answer this question."

    def extract_structured(
        self,
        prompt: str,
        schema: type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0,
    ) -> T:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in .env")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        json_schema = schema.model_json_schema()
        body = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
                "responseSchema": json_schema,
            },
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return schema.model_validate_json(text)


class OpenAILLMProvider(LLMProvider):
    """OpenAI Chat Completion API implementation with Structured Outputs."""

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model
        if not self.api_key:
            logger.warning("OpenAILLMProvider initialized without OPENAI_API_KEY")

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured in .env")
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def extract_structured(
        self,
        prompt: str,
        schema: type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0,
    ) -> T:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured in .env")
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": schema.__name__,
                    "strict": True,
                    "schema": schema.model_json_schema(),
                },
            },
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_json = data["choices"][0]["message"]["content"]
            return schema.model_validate_json(raw_json)


def get_llm_provider() -> LLMProvider:
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "gemini" or (settings.GEMINI_API_KEY and provider_name != "mock" and provider_name != "openai"):
        return GeminiLLMProvider(model=settings.LLM_MODEL)
    elif provider_name == "openai" or (settings.OPENAI_API_KEY and provider_name != "mock"):
        return OpenAILLMProvider(model=settings.LLM_MODEL)
    return MockLLMProvider(model=settings.LLM_MODEL)
