"""
Food Craft AI — FAISS Index Builder (CLI Script)
─────────────────────────────────────────────────
Builds the SBERT + FAISS vector search index from the RecipeNLG dataset.

Usage:
    cd backend
    python -m scripts.build_index                      # Index 50,000 recipes (default)
    python -m scripts.build_index --max-recipes 100000  # Index 100,000 recipes
    python -m scripts.build_index --all                 # Index ALL 2.2M+ recipes
    python -m scripts.build_index --local ../data/Cleaned_dataset.csv  # Use local CSV
"""

import argparse
import logging
import sys
import time

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("build_index")


def main():
    parser = argparse.ArgumentParser(description="Build FAISS recipe search index")
    parser.add_argument(
        "--max-recipes",
        type=int,
        default=50_000,
        help="Maximum number of recipes to index (default: 50,000)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Index ALL recipes (overrides --max-recipes)",
    )
    parser.add_argument(
        "--local",
        type=str,
        default=None,
        help="Path to a local CSV or Parquet file (skips Hugging Face download)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=512,
        help="SBERT encoding batch size (default: 512)",
    )
    args = parser.parse_args()

    from app.services import retrieval_service
    from app.core.config import settings

    # Override batch size if specified
    settings.INDEX_BATCH_SIZE = args.batch_size

    max_recipes = 0 if args.all else args.max_recipes

    logger.info("=" * 60)
    logger.info("  Food Craft AI — FAISS Index Builder")
    logger.info("=" * 60)
    logger.info("  Target recipes : %s", "ALL" if max_recipes == 0 else f"{max_recipes:,}")
    logger.info("  Batch size     : %d", settings.INDEX_BATCH_SIZE)
    logger.info("  SBERT model    : %s", settings.SBERT_MODEL_NAME)
    logger.info("  Index output   : %s", settings.FAISS_INDEX_PATH)
    logger.info("=" * 60)

    # Load dataset
    start = time.time()
    if args.local:
        logger.info("Loading dataset from local file: %s", args.local)
        df = retrieval_service.load_dataset_from_local(args.local)
    else:
        logger.info("Downloading dataset from Hugging Face Hub ...")
        df = retrieval_service.load_dataset_from_hf()

    load_time = time.time() - start
    logger.info("Dataset loaded in %.1f seconds: %d rows", load_time, len(df))

    # Build index
    start = time.time()
    index, meta = retrieval_service.build_index(df=df, max_recipes=max_recipes, save=True)
    build_time = time.time() - start

    logger.info("=" * 60)
    logger.info("  INDEX BUILD COMPLETE")
    logger.info("  Vectors indexed  : %d", index.ntotal)
    logger.info("  Metadata rows    : %d", len(meta))
    logger.info("  Build time       : %.1f seconds (%.1f minutes)", build_time, build_time / 60)
    logger.info("  Total time       : %.1f seconds", load_time + build_time)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
