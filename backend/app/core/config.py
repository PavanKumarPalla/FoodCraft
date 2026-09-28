"""
Food Craft AI Backend — Application Configuration
───────────────────────────────────────────────────
Central settings for paths, model names, API keys, and tuning knobs.
All values can be overridden via environment variables or a .env file.
"""

from pathlib import Path
from pydantic_settings import BaseSettings


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
    YOLO_CUSTOM_WEIGHTS: str = str(MODELS_DIR / "yolov8n_food_ingredients.pt")
    YOLO_FALLBACK_WEIGHTS: str = "yolov8n.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.35

    # ── Sentence-Transformers (SBERT) ────────────────────────
    SBERT_MODEL_NAME: str = "all-MiniLM-L6-v2"

    # ── FAISS Vector Index ───────────────────────────────────
    FAISS_INDEX_PATH: str = str(INDEX_DIR / "recipes.faiss")
    FAISS_METADATA_PATH: str = str(INDEX_DIR / "recipes_meta.parquet")
    FAISS_TOP_K: int = 20

    # ── Hugging Face Dataset ─────────────────────────────────
    HF_DATASET_REPO: str = "FoodCraft/foodcraft-recipes"
    HF_DATASET_FILENAME: str = "Cleaned_dataset.csv"
    HF_TOKEN: str = ""

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


# ── Singleton instance ───────────────────────────────────────
settings = Settings()
