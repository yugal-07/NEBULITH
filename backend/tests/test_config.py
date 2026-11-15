from backend.core.config import Settings
from backend.core.interfaces import LLMProvider, EmbeddingProvider
from backend.core.providers.embedding import (
    get_embedding_provider,
    MockEmbeddingProvider,
    LocalEmbeddingProvider,
)
from backend.core.providers.llm import get_llm_provider, MockLLMProvider


def test_default_config():
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


def test_embedding_provider_interface():
    # Test active provider (Local bge-small-en-v1.5)
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
