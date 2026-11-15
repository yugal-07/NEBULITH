from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class EmbeddingProvider(ABC):
    """Interface for swappable text embedding providers."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector dimension produced by this provider."""
        pass

    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        """Embed a single text string into a vector."""
        pass

    @abstractmethod
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of text strings into vectors."""
        pass


class LLMProvider(ABC):
    """Interface for swappable LLM providers."""

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> str:
        """Generate a text completion given a prompt."""
        pass

    @abstractmethod
    def extract_structured(
        self,
        prompt: str,
        schema: type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0,
    ) -> T:
        """Extract structured data adhering strictly to the given Pydantic schema."""
        pass
