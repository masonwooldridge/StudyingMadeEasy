import os
import platform
from functools import lru_cache

import numpy as np

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def _embedding_backend() -> str:
    configured_backend = os.getenv("EMBEDDING_BACKEND")
    if configured_backend:
        return configured_backend.lower()

    # Render's free Linux instances have 512 MB of memory. FastEmbed runs the
    # same MiniLM model through ONNX and keeps the Mac/Windows development
    # setup on Sentence Transformers.
    return "fastembed" if platform.system() == "Linux" else "sentence-transformers"


@lru_cache(maxsize=1)
def _get_model():
    if _embedding_backend() == "fastembed":
        from fastembed import TextEmbedding

        return TextEmbedding(model_name=MODEL_NAME)

    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def generate_embedding(text: str) -> list[float]:
    model = _get_model()

    if _embedding_backend() == "fastembed":
        embedding = next(model.embed([text]))
        norm = np.linalg.norm(embedding)
        if norm:
            embedding = embedding / norm
    else:
        embedding = model.encode(
            text,
            normalize_embeddings=True,
        )

    return embedding.tolist()
