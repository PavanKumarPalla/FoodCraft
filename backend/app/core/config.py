"""
Food Craft AI Backend — Application Configuration
───────────────────────────────────────────────────
Central settings for paths, model names, API keys, and tuning knobs.
All values can be overridden via environment variables or a .env file.
"""

from pathlib import Path
import os

_HAS_PYDANTIC_SETTINGS = False
try:
    from pydantic_settings import BaseSettings
    _HAS_PYDANTIC_SETTINGS = True
except ImportError:
    try:
        from pydantic import BaseModel as BaseSettings
    except ImportError:
        class BaseSettings:
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)


# ── Path Constants ───────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
INDEX_DIR = DATA_DIR / "index"


class Settings(BaseSettings):
    """Application-wide configuration with sensible defaults."""

    # ── Server ───────────────────────────────────────────────
    APP_NAME: str = "Food Craft AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["*"]

    # ── YOLOv8 Vision Model ──────────────────────────────────
    YOLO_CUSTOM_WEIGHTS: str = str(MODELS_DIR / "yolov8_food_ingredients.pt")
    YOLO_FALLBACK_WEIGHTS: str = "yolov8n.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.35

    # ── Sentence-Transformers (SBERT) ────────────────────────
    SBERT_MODEL_NAME: str = "all-MiniLM-L6-v2"

    # ── FAISS Vector Index ───────────────────────────────────
    FAISS_INDEX_PATH: str = str(INDEX_DIR / "recipes.faiss")
    FAISS_METADATA_PATH: str = str(INDEX_DIR / "recipes_meta.parquet")
    FAISS_TOP_K: int = 20

    # ── Hugging Face Dataset ─────────────────────────────────
    HF_DATASET_REPO: str = "Default-Box/recipe_nlg-trim"
    HF_DATASET_FILENAME: str = "train.csv"
    HF_TOKEN: str = ""

    # ── Fine-Tuned Llama-3.2-Vision (Hugging Face) ───────────
    HF_VISION_MODEL_ID: str = "pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision"
    HF_VISION_LORA_ID: str = "pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision-LoRA"
    HF_VISION_INFERENCE_URL: str = ""
    HF_VISION_USE_ROUTER: bool = False
    HF_USE_VISION_LLM: bool = True

    # ── Index Build Settings ─────────────────────────────────
    INDEX_MAX_RECIPES: int = 50_000  # Recipes to index (set 0 for ALL)
    INDEX_BATCH_SIZE: int = 512

    # ── Image Service ────────────────────────────────────────
    WIKIPEDIA_API_URL: str = "https://en.wikipedia.org/api/rest_v1/page/summary"
    POLLINATIONS_URL: str = "https://image.pollinations.ai/prompt"
    POLLINATIONS_WIDTH: int = 600
    POLLINATIONS_HEIGHT: int = 400

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


def _fallback_env_kwargs() -> dict:
    """Load BASE_DIR/.env + os.environ overrides when pydantic-settings is absent."""
    merged: dict[str, str] = {}
    env_path = BASE_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            merged[k.strip()] = v.strip().strip('"').strip("'")
    for field_name in getattr(Settings, "__annotations__", {}):
        if field_name in os.environ:
            merged[field_name] = os.environ[field_name]
    annotations = getattr(Settings, "__annotations__", {})
    kwargs: dict = {}
    for k, raw in merged.items():
        if k not in annotations:
            continue
        ann = annotations[k]
        if ann is bool or ann == "bool":
            kwargs[k] = raw.lower() in ("1", "true", "yes", "on")
        elif ann is int or ann == "int":
            kwargs[k] = int(raw)
        elif ann is float or ann == "float":
            kwargs[k] = float(raw)
        else:
            kwargs[k] = raw
    return kwargs


# ── Singleton instance ───────────────────────────────────────
settings = Settings() if _HAS_PYDANTIC_SETTINGS else Settings(**_fallback_env_kwargs())
