"""
Food Craft AI — Retrieval Service (SBERT + FAISS)
──────────────────────────────────────────────────
Builds and queries a vector search index over the RecipeNLG dataset
for semantic ingredient-to-recipe matching.
"""

from __future__ import annotations

import ast
import json
import logging
from pathlib import Path

try:
    import faiss
except ImportError:
    faiss = None

import numpy as np
import pandas as pd

from app.core.config import settings, INDEX_DIR

logger = logging.getLogger(__name__)

# ── Module-level singletons ──────────────────────────────────
_sbert_model = None
_faiss_index = None
_recipe_metadata: pd.DataFrame | None = None


# ─────────────────────────────────────────────────────────────
# Model & Data Loading
# ─────────────────────────────────────────────────────────────

def _get_sbert():
    """Load the SBERT model (lazy singleton)."""
    global _sbert_model
    if _sbert_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading SBERT model: %s ...", settings.SBERT_MODEL_NAME)
        _sbert_model = SentenceTransformer(settings.SBERT_MODEL_NAME)
        logger.info("SBERT model loaded. Embedding dimension: %d", _sbert_model.get_sentence_embedding_dimension())
    return _sbert_model


def _format_ner_text(val) -> str:
    if val is None:
        return ""
    if isinstance(val, list):
        return ", ".join(str(i).strip() for i in val if str(i).strip())
    if isinstance(val, str):
        return ", ".join(_parse_string_list(val))
    return ""


def _parse_string_list(raw: str) -> list[str]:
    """Safely parse a stringified Python list like '["a","b"]' into a real list."""
    if not isinstance(raw, str) or not raw.strip():
        return []
    try:
        parsed = ast.literal_eval(raw)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed]
    except (ValueError, SyntaxError):
        pass
    # Fallback: strip brackets and split on commas
    cleaned = raw.strip("[] ")
    return [s.strip().strip('"').strip("'") for s in cleaned.split(",") if s.strip()]


def load_dataset_from_hf() -> pd.DataFrame:
    """
    Download the recipe dataset from Hugging Face Hub.
    Returns a DataFrame with columns: title, ingredients, directions, NER.
    """
    from huggingface_hub import hf_hub_download

    logger.info("Downloading dataset from HF: %s / %s ...", settings.HF_DATASET_REPO, settings.HF_DATASET_FILENAME)

    token = settings.HF_TOKEN if settings.HF_TOKEN else None
    local_path = hf_hub_download(
        repo_id=settings.HF_DATASET_REPO,
        filename=settings.HF_DATASET_FILENAME,
        repo_type="dataset",
        token=token,
    )

    logger.info("Dataset downloaded to cache: %s", local_path)
    try:
        df = pd.read_csv(local_path, on_bad_lines="skip")
    except Exception:
        df = pd.read_csv(local_path, engine="python", on_bad_lines="skip")
    logger.info("Dataset loaded: %d rows, columns: %s", len(df), list(df.columns))
    return df


def load_dataset_from_local(path: str | Path) -> pd.DataFrame:
    """Load the recipe dataset from a local CSV or Parquet file."""
    path = Path(path)
    if path.suffix == ".parquet":
        return pd.read_parquet(path)
    return pd.read_csv(path)


# ─────────────────────────────────────────────────────────────
# Index Building
# ─────────────────────────────────────────────────────────────

def build_index(
    df: pd.DataFrame | None = None,
    max_recipes: int | None = None,
    save: bool = True,
) -> tuple[faiss.IndexFlatIP, pd.DataFrame]:
    """
    Build the FAISS index from recipe NER tags.

    Steps:
        1. Parse the NER column into a natural-language ingredient string.
        2. Encode with SBERT → 384-dim normalized vectors.
        3. Store in FAISS IndexFlatIP (inner product ≈ cosine after L2 norm).
        4. Save index + metadata to disk.

    Returns:
        (faiss_index, metadata_dataframe)
    """
    global _faiss_index, _recipe_metadata

    if df is None:
        df = load_dataset_from_hf()

    if max_recipes is None:
        max_recipes = settings.INDEX_MAX_RECIPES

    # Subset if requested (0 = use all)
    if max_recipes > 0 and len(df) > max_recipes:
        logger.info("Subsetting dataset: %d → %d recipes", len(df), max_recipes)
        df = df.head(max_recipes).copy()
    else:
        df = df.copy()

    # Clean and prepare NER text
    logger.info("Parsing NER tags for %d recipes ...", len(df))
    df["ner_text"] = df["NER"].apply(lambda x: ", ".join(_parse_string_list(str(x))) if pd.notna(x) else "")
    df = df[df["ner_text"].str.len() > 0].reset_index(drop=True)
    logger.info("Recipes with valid NER tags: %d", len(df))

    # Encode with SBERT
    model = _get_sbert()
    texts = df["ner_text"].tolist()

    logger.info("Encoding %d ingredient texts (batch_size=%d) ...", len(texts), settings.INDEX_BATCH_SIZE)
    embeddings = model.encode(
        texts,
        batch_size=settings.INDEX_BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,  # L2-normalize → inner product = cosine similarity
        convert_to_numpy=True,
    )
    embeddings = embeddings.astype(np.float32)

    # Build FAISS index
    dim = embeddings.shape[1]
    logger.info("Building FAISS IndexFlatIP with %d vectors of dimension %d ...", len(embeddings), dim)
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    # Prepare metadata (the data we return alongside vector search results)
    meta = df[["title", "ingredients", "directions", "NER", "ner_text"]].copy()
    meta = meta.reset_index(drop=True)

    _faiss_index = index
    _recipe_metadata = meta

    if save:
        _save_index(index, meta)

    logger.info("FAISS index built: %d vectors indexed.", index.ntotal)
    return index, meta


def _save_index(index: faiss.IndexFlatIP, meta: pd.DataFrame):
    """Persist the FAISS index and recipe metadata to disk."""
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    index_path = Path(settings.FAISS_INDEX_PATH)
    meta_path = Path(settings.FAISS_METADATA_PATH)

    faiss.write_index(index, str(index_path))
    meta.to_parquet(str(meta_path), index=False)

    logger.info("Index saved: %s (%d vectors)", index_path, index.ntotal)
    logger.info("Metadata saved: %s (%d rows)", meta_path, len(meta))


# ─────────────────────────────────────────────────────────────
# Index Loading (for server startup)
# ─────────────────────────────────────────────────────────────

def load_index() -> bool:
    """
    Load a pre-built FAISS index and metadata from disk.
    Returns True if successful, False if files are missing.
    """
    global _faiss_index, _recipe_metadata

    index_path = Path(settings.FAISS_INDEX_PATH)
    meta_path = Path(settings.FAISS_METADATA_PATH)

    if not index_path.exists() or not meta_path.exists():
        logger.warning("Pre-built index not found. Run `python -m scripts.build_index` first.")
        return False

    logger.info("Loading pre-built FAISS index from %s ...", index_path)
    _faiss_index = faiss.read_index(str(index_path))
    _recipe_metadata = pd.read_parquet(str(meta_path))

    logger.info(
        "Index loaded: %d vectors | Metadata: %d recipes",
        _faiss_index.ntotal,
        len(_recipe_metadata),
    )
    return True


def is_index_ready() -> bool:
    """Check whether the FAISS index is loaded and ready for queries."""
    return _faiss_index is not None and _recipe_metadata is not None


# ─────────────────────────────────────────────────────────────
# Query / Retrieval
# ─────────────────────────────────────────────────────────────

def search_recipes(
    ingredients: list[str],
    top_k: int | None = None,
) -> list[dict]:
    """
    Find the best-matching recipes for a given list of ingredients.

    Args:
        ingredients: List of ingredient names, e.g. ["chicken", "garlic", "onion"]
        top_k: Number of results to return (default from settings).

    Returns:
        List of recipe dicts sorted by relevance (cosine similarity).
    """
    if not is_index_ready():
        raise RuntimeError("FAISS index is not loaded. Build or load the index first.")

    if top_k is None:
        top_k = settings.FAISS_TOP_K

    model = _get_sbert()
    query_text = ", ".join(ingredients)

    # Encode query and normalize
    query_vec = model.encode(
        [query_text],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype(np.float32)

    # Search FAISS
    scores, indices = _faiss_index.search(query_vec, top_k)

    results = []
    for rank, (score, idx) in enumerate(zip(scores[0], indices[0])):
        if idx < 0 or idx >= len(_recipe_metadata):
            continue  # FAISS returns -1 for missing results

        row = _recipe_metadata.iloc[idx]

        # Parse stringified lists back into proper lists
        ingredients_list = _parse_string_list(str(row.get("ingredients", "[]")))
        directions_list = _parse_string_list(str(row.get("directions", "[]")))
        ner_list = _parse_string_list(str(row.get("NER", "[]")))

        results.append({
            "rank": rank + 1,
            "title": str(row.get("title", "Untitled")),
            "ingredients": ingredients_list,
            "directions": directions_list,
            "ner_tags": ner_list,
            "similarity_score": round(float(score), 4),
        })

    logger.info(
        "Query '%s' → %d results (top score: %.4f)",
        query_text,
        len(results),
        results[0]["similarity_score"] if results else 0.0,
    )

    return results
