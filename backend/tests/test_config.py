from backend.core.config import Settings
from backend.core.config import settings
from backend.core.interfaces import LLMProvider, EmbeddingProvider
from backend.core.providers.embedding import (
    get_embedding_provider,
    MockEmbeddingProvider,
    LocalEmbeddingProvider,
)
from backend.core.providers.llm import get_llm_provider, MockLLMProvider


def test_default_config(monkeypatch):
    monkeypatch.setenv("EMBEDDING_PROVIDER", "local")
    monkeypatch.delenv("FRONTEND_ORIGIN", raising=False)
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    s = Settings()
    assert s.PROJECT_NAME == "NEBULITH"
    assert s.MAX_UPLOAD_SIZE_MB == 50
    assert "pdf" in s.ALLOWED_EXTENSIONS
    assert "docx" in s.ALLOWED_EXTENSIONS
    assert "csv" in s.ALLOWED_EXTENSIONS
    assert "xlsx" in s.ALLOWED_EXTENSIONS
    assert s.EMBEDDING_PROVIDER == "local"
    assert s.EMBEDDING_MODEL == "BAAI/bge-small-en-v1.5"
    assert s.EMBEDDING_DIMENSION == 384
    assert "https://nebulith.netlify.app" in s.CORS_ORIGINS


def test_frontend_origin_is_merged_with_configured_cors_origins(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://nebulith.netlify.app/")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")

    s = Settings()

    assert s.CORS_ORIGINS == [
        "https://nebulith.netlify.app",
        "http://localhost:5173",
    ]


def test_embedding_provider_interface(monkeypatch):
    # Exercise provider selection and vector interface without downloading a model.
    class FakeFastEmbedModel:
        def embed(self, texts):
            return ([0.25] * 384 for _ in texts)

    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "local")
    monkeypatch.setattr(LocalEmbeddingProvider, "_model", FakeFastEmbedModel())
    provider = get_embedding_provider()
    assert isinstance(provider, EmbeddingProvider)
    assert isinstance(provider, LocalEmbeddingProvider)
    assert provider.dimension == 384

    vec = provider.embed_text("Martian regolith simulant")
    assert isinstance(vec, list)
    assert len(vec) == 384
    assert all(isinstance(x, float) for x in vec)

    batch_vecs = provider.embed_batch(["Martian surface", "Lunar soil"])
    assert len(batch_vecs) == 2
    assert len(batch_vecs[0]) == 384

    # Also test Mock provider for unit tests
    mock_p = MockEmbeddingProvider(dim=384)
    m_vec = mock_p.embed_text("Test query")
    assert len(m_vec) == 384


def test_llm_provider_interface():
    llm = get_llm_provider()
    assert isinstance(llm, LLMProvider)
    assert isinstance(llm, MockLLMProvider)
    response = llm.generate("Extract target environment parameters")
    assert isinstance(response, str)
    assert len(response) > 0
