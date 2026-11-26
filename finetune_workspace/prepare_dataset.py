"""
Food Craft Fine-Tune Workspace — Dataset Fetcher & Formatter (via HF_TOKEN)
──────────────────────────────────────────────────────────────────────────
Fetches Food Craft's recipe database (`pavankumarpalla/FoodCraft`) and aligned
vision datasets from Hugging Face using HF_TOKEN, or uses locally extracted
`data/unsloth_foodcraft/train_conversations.jsonl` if already present.

Also produces balanced & structured-JSON vision training conversations so the
fine-tuned Llama-3.2-Vision model integrates cleanly with Food Craft's API.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import subprocess
import sys
from pathlib import Path

from config import FineTuneConfig, REPO_ROOT, resolve_hf_token


def build_balanced_training_jsonl(
    source_jsonl: Path,
    dest_jsonl: Path,
    max_per_source: int = 25000,
    seed: int = 3407,
) -> dict:
    """
    Build a balanced, Food-Craft-ready conversational dataset from extracted JSONL.

    Keeps full coverage of all Indian dish classes and multi-ingredient FoodSeg103
    plates while balancing massive 100k+ datasets so no single source dominates.
    """
    rng = random.Random(seed)
    by_source: dict[str, list[dict]] = {}

    with source_jsonl.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            row = json.loads(line)
            if row.get("split", "train") != "train":
                continue
            src = row.get("source", "unknown")
            by_source.setdefault(src, []).append(row)

    selected: list[dict] = []
    source_counts: dict[str, int] = {}
    for src, rows in sorted(by_source.items()):
        if max_per_source > 0 and len(rows) > max_per_source:
            sampled = rng.sample(rows, max_per_source)
        else:
            sampled = rows
        source_counts[src] = len(sampled)
        selected.extend(sampled)

    rng.shuffle(selected)
    dest_jsonl.parent.mkdir(parents=True, exist_ok=True)

    with dest_jsonl.open("w", encoding="utf-8") as out_f:
        for idx, row in enumerate(selected):
            labels = row.get("labels", [])
            img_path = row.get("image_path")
            if not labels or not img_path or not Path(img_path).exists():
                continue

            # Mix natural Food Craft prompts + strict JSON prompts (every 3rd sample)
            # so the deployed model handles both chat queries and structured API parsing.
            if idx % 3 == 0:
                prompt = (
                    "Analyze this food image for Food Craft and reply ONLY with JSON in this format: "
                    '{"ingredients": ["Item1", "Item2"], "dish": "DishNameOrNone"}.'
                )
                dish_val = "None" if row.get("source") in ("vegfru", "food_and_vegetables", "food_ingredients") else labels[0]
                answer = json.dumps({"ingredients": labels, "dish": dish_val}, ensure_ascii=False)
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "image", "image": img_path},
                            {"type": "text", "text": prompt},
                        ],
                    },
                    {
                        "role": "assistant",
                        "content": [{"type": "text", "text": answer}],
                    },
                ]
            else:
                messages = row["messages"]

            out_f.write(json.dumps({
                "id": row.get("id", f"fc_{idx}"),
                "source": row.get("source"),
                "labels": labels,
                "image_path": img_path,
                "messages": messages,
            }, ensure_ascii=False) + "\n")

    return {"total_train_samples": len(selected), "by_source": source_counts, "output_jsonl": str(dest_jsonl)}


def ensure_datasets_fetched(
    cfg: FineTuneConfig,
    token: str | None,
    stages: list[str] | None = None,
    prune_raw: bool = False,
) -> Path:
    """Use HF_TOKEN to fetch missing datasets into cfg.data_root if not already unpacked."""
    raw_jsonl = cfg.data_root / "unsloth_foodcraft" / "train_conversations.jsonl"
    downloader_script = REPO_ROOT / "scripts" / "download_foodcraft_vision_dataset.py"

    if raw_jsonl.exists() and not stages:
        print(f"Using existing extracted dataset at: {raw_jsonl}")
        return raw_jsonl

    if not downloader_script.exists():
        raise FileNotFoundError(f"Expected downloader script at {downloader_script}")

    env = os.environ.copy()
    if token:
        env["HF_TOKEN"] = token
    env["HF_HOME"] = str(cfg.data_root / "hf_cache")

    cmd = [sys.executable, "-u", str(downloader_script)]
    if stages:
        cmd.extend(["--stages", *stages])
    if prune_raw:
        cmd.append("--prune-raw")

    print(f"Fetching datasets via HF_TOKEN -> {' '.join(cmd)}", flush=True)
    proc = subprocess.run(cmd, env=env, cwd=str(REPO_ROOT))
    if proc.returncode != 0:
        raise RuntimeError(f"Dataset fetch failed with exit code {proc.returncode}")

    return raw_jsonl


def push_dataset_to_hub(jsonl_path: Path, repo_id: str, token: str) -> None:
    """Optionally push lightweight dataset manifest/JSONL index to Hugging Face."""
    from huggingface_hub import HfApi

    api = HfApi(token=token)
    api.create_repo(repo_id=repo_id, repo_type="dataset", exist_ok=True)
    api.upload_file(
        path_or_fileobj=str(jsonl_path),
        path_in_repo=jsonl_path.name,
        repo_id=repo_id,
        repo_type="dataset",
        commit_message="Upload Food Craft formatted multimodal training manifest",
    )
    print(f"Pushed {jsonl_path.name} -> https://huggingface.co/datasets/{repo_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Food Craft multimodal dataset using HF_TOKEN")
    parser.add_argument("--hf-token", default=None, help="Hugging Face access token (defaults to HF_TOKEN / .env)")
    parser.add_argument("--stages", nargs="*", default=None, help="Optional subset of stages to download via HF_TOKEN")
    parser.add_argument("--max-per-source", type=int, default=15000, help="Cap samples per dataset source (0 = all)")
    parser.add_argument("--prune-raw", action="store_true", help="Delete raw .parquet/.zip archives after extraction to save cloud GPU disk")
    parser.add_argument("--push-jsonl-to-hub", action="store_true", help="Push balanced JSONL manifest to HF dataset repo")
    args = parser.parse_args()

    cfg = FineTuneConfig()
    token = resolve_hf_token(args.hf_token)
    if not token:
        raise RuntimeError("HF_TOKEN is required. Pass --hf-token or set HF_TOKEN in environment / backend/.env.")

    source_jsonl = ensure_datasets_fetched(cfg, token, stages=args.stages, prune_raw=args.prune_raw)
    balanced_jsonl = cfg.data_root / "unsloth_foodcraft" / "train_balanced.jsonl"
    stats = build_balanced_training_jsonl(
        source_jsonl=source_jsonl,
        dest_jsonl=balanced_jsonl,
        max_per_source=args.max_per_source,
        seed=cfg.seed,
    )
    print("Prepared balanced Unsloth training JSONL:")
    print(json.dumps(stats, indent=2))

    if args.push_jsonl_to_hub:
        push_dataset_to_hub(balanced_jsonl, cfg.hub_dataset_repo, token)


if __name__ == "__main__":
    main()
