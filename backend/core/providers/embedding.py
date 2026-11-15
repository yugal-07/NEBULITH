from __future__ import annotations

import hashlib
import math
from typing import Literal
import httpx
from ..config import settings
from ..interfaces import EmbeddingProvider
from ..logging import logger


class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic hash-based embedding provider for unit tests and offline testing only."""

    def __init__(self, dim: int = 384):
        self._dim = dim

    @property
    def dimension(self) -> int:
        return self._dim

    def _hash_vector(self, text: str) -> list[float]:
        vec = []
        seed = text.encode("utf-8")
        h1 = hashlib.sha256(seed).digest()
        h2 = hashlib.md5(seed).digest()
        combined = h1 + h2
        
        for i in range(self._dim):
            byte_val = combined[i % len(combined)]
            val = (byte_val / 128.0) - 1.0 + math.sin(i * 0.1)
            vec.append(val)

        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 6) for x in vec]

    def embed_text(self, text: str) -> list[float]:
        return self._hash_vector(text)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self._hash_vector(t) for t in texts]


class LocalEmbeddingProvider(EmbeddingProvider):
    """
    Real local dense embedding provider using fastembed (ONNX runtime).
    Defaults to BAAI/bge-small-en-v1.5 (dimension: 384).
    Zero API keys or external network required after initial cache.
    """

    _instance: LocalEmbeddingProvider | None = None
    _model = None

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5", dim: int = 384):
        self.model_name = model_name
        self._dim = dim
        self._init_model()

    def _init_model(self):
        if LocalEmbeddingProvider._model is None:
            try:
                from fastembed import TextEmbedding
                logger.info(f"Loading local embedding model: {self.model_name}")
                LocalEmbeddingProvider._model = TextEmbedding(model_name=self.model_name)
            except Exception as e:
                logger.error(f"Failed to load fastembed model {self.model_name}: {e}")
                raise

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_text(self, text: str) -> list[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        self._init_model()
        # generator of numpy arrays
        embeddings_gen = LocalEmbeddingProvider._model.embed(texts)
        result = []
        for emb in embeddings_gen:
            result.append([round(float(x), 6) for x in emb])
        return result


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI Embeddings API implementation."""

    def __init__(self, api_key: str | None = None, model: str = "text-embedding-3-small", dim: int = 1536):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model
        self._dim = dim
        if not self.api_key:
            logger.warning("OpenAIEmbeddingProvider initialized without OPENAI_API_KEY")

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_text(self, text: str) -> list[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {"input": texts, "model": self.model, "dimensions": self._dim}
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()["data"]
            return [item["embedding"] for item in data]


def get_embedding_provider() -> EmbeddingProvider:
    provider_name = settings.EMBEDDING_PROVIDER.lower()
    if provider_name == "mock":
        return MockEmbeddingProvider(dim=settings.EMBEDDING_DIMENSION)
    elif provider_name == "openai":
        return OpenAIEmbeddingProvider(dim=settings.EMBEDDING_DIMENSION, model=settings.EMBEDDING_MODEL)
    else:  # 'local' or default
        return LocalEmbeddingProvider(model_name=settings.EMBEDDING_MODEL, dim=settings.EMBEDDING_DIMENSION)
