"""
Food Craft Fine-Tune Workspace — Central Configuration
────────────────────────────────────────────────────
Resolves HF_TOKEN securely from environment variables, Colab Secrets,
or local .env files (NEVER hardcode tokens in tracked source files).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

WORKSPACE_DIR = Path(__file__).resolve().parent
REPO_ROOT = WORKSPACE_DIR.parent
IS_KAGGLE = bool(os.environ.get("KAGGLE_KERNEL_RUN_TYPE") or Path("/kaggle/working").exists())
# On Kaggle, keep bulky streamed JPEGs & model outputs in /tmp so /kaggle/working stays small for Draft saves
DEFAULT_DATA_DIR = Path("/tmp/foodcraft_data") if IS_KAGGLE else (REPO_ROOT / "data")
DEFAULT_OUTPUT_DIR = Path("/tmp/foodcraft_outputs") if IS_KAGGLE else (WORKSPACE_DIR / "outputs")


def resolve_hf_token(explicit_token: str | None = None) -> str | None:
    """Resolve Hugging Face token from CLI arg, env, Colab userdata, or .env files."""
    if explicit_token and explicit_token.strip():
        tok = explicit_token.strip()
        os.environ["HF_TOKEN"] = tok
        return tok

    if os.environ.get("HF_TOKEN", "").strip():
        return os.environ["HF_TOKEN"].strip()

    # Support Google Colab Secrets automatically when running in Colab
    try:
        from google.colab import userdata  # type: ignore

        colab_tok = userdata.get("HF_TOKEN")
        if colab_tok and str(colab_tok).strip():
            os.environ["HF_TOKEN"] = str(colab_tok).strip()
            return os.environ["HF_TOKEN"]
    except Exception:
        pass

    # Support Kaggle Secrets automatically when running in Kaggle Notebooks
    try:
        from kaggle_secrets import UserSecretsClient  # type: ignore

        kaggle_tok = UserSecretsClient().get_secret("HF_TOKEN")
        if kaggle_tok and str(kaggle_tok).strip():
            os.environ["HF_TOKEN"] = str(kaggle_tok).strip()
            return os.environ["HF_TOKEN"]
    except Exception:
        pass

    for env_file in (WORKSPACE_DIR / ".env", REPO_ROOT / "backend" / ".env", REPO_ROOT / ".env"):
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                k, v = stripped.split("=", 1)
                if k.strip() == "HF_TOKEN":
                    cleaned = v.strip().strip('"').strip("'")
                    if cleaned:
                        os.environ["HF_TOKEN"] = cleaned
                        return cleaned

    try:
        from huggingface_hub import get_token

        cached = get_token()
        if cached:
            return cached
    except Exception:
        pass

    return None


@dataclass
class FineTuneConfig:
    """Configuration for dataset fetching, Unsloth training, and HF Hub upload."""

    base_model_id: str = "unsloth/Llama-3.2-11B-Vision-Instruct-bnb-4bit"
    base_unquantized_id: str = "unsloth/Llama-3.2-11B-Vision-Instruct"
    hub_model_repo: str = os.environ.get("HF_VISION_MODEL_ID", "pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision")
    hub_lora_repo: str = os.environ.get("HF_VISION_LORA_ID", "pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision-LoRA")
    hub_dataset_repo: str = os.environ.get("HF_VISION_DATASET_REPO", "pavankumarpalla/FoodCraft-Vision-Dataset")
    recipe_dataset_repo: str = os.environ.get("HF_DATASET_REPO", "pavankumarpalla/FoodCraft")
    recipe_dataset_filename: str = "Cleaned_dataset.csv"

    # Public food/ingredient/Indian dish HF datasets aligned with Food Craft
    vision_dataset_repos: dict[str, str] = field(default_factory=lambda: {
        "indian_foods_15": "bharat-raghunathan/indian-foods-dataset",
        "foodseg103": "EduardoPacheco/FoodSeg103",
        "indian_food_20": "rajistics/indian_food_images",
        "food121": "ItsNotRohit/Food121",
        "vegfru": "SEU-VIPGroup/FG-BMK-image-VegFru",
        "food_and_vegetables": "SunnyAgarwal4274/Food_and_Vegetables",
        "food_ingredients": "SunnyAgarwal4274/Food_Ingredients",
    })

    data_root: Path = DEFAULT_DATA_DIR
    output_dir: Path = DEFAULT_OUTPUT_DIR
    lora_rank: int = 16
    lora_alpha: int = 16
    max_seq_length: int = 1024
    max_image_dim: int = 560
    learning_rate: float = 2e-4
    per_device_batch_size: int = 2
    gradient_accumulation_steps: int = 4
    warmup_steps: int = 15
    max_steps: int = 150
    num_train_epochs: int = 1
    seed: int = 3407
