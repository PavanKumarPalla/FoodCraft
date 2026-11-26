"""
Food Craft Fine-Tune Workspace — Dataset Fetcher & Formatter (via HF_TOKEN)
──────────────────────────────────────────────────────────────────────────
Fetches Food Craft's recipe database (`pavankumarpalla/FoodCraft`) and aligned
food/ingredient/Indian dish image datasets via HF_TOKEN.

Supports two modes:
  1. Local unpacked mode (on D:/Food Craft/data/unsloth_foodcraft/train_conversations.jsonl)
  2. Cloud GPU low-disk streaming mode (--stream-cloud, auto-enabled on Kaggle/Colab
     when free disk < 45 GB): streams images straight from Hugging Face via HF_TOKEN
     up to --max-per-source without downloading 40+ GB raw archives!
"""

from __future__ import annotations

import argparse
import ast
import csv
import json
import os
import random
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

from config import FineTuneConfig, REPO_ROOT, resolve_hf_token

SINGLE_DISH_PROMPTS = [
    "Identify the food dish shown in this image for Food Craft meal matching.",
    "What food item or dish is in this photo? Give its clean common name.",
    "Analyze this food image and state what dish or item it depicts.",
]

PRODUCE_PROMPTS = [
    "Identify this fruit, vegetable, or cooking ingredient.",
    "What raw food ingredient is pictured here?",
    "Recognize the fruit, vegetable, or pantry ingredient in this image.",
]

INGREDIENT_LIST_PROMPTS = [
    "List all visible food ingredients in this image for Food Craft recipe matching.",
    "Identify every distinct ingredient or food component you can see on this plate.",
    "Scan this food photo and return the visible ingredients.",
]


def clean_label(raw: str) -> str:
    overrides = {
        "cholebhature": "Chole Bhature",
        "kathiroll": "Kathi Roll",
        "panipuri": "Pani Puri",
        "pavbhaji": "Pav Bhaji",
        "vadapav": "Vada Pav",
        "paani_puri": "Pani Puri",
        "panner_butter_masala": "Paneer Butter Masala",
        "hamburg": "Hamburger",
    }
    key = raw.strip().lower()
    if key in overrides:
        return overrides[key]
    return " ".join(w.capitalize() for w in raw.replace("_", " ").replace("-", " ").split())


def save_pil_rgb(pil_img: Image.Image, dest_path: Path, max_dim: int = 768) -> bool:
    """Save a PIL image cleanly as RGB JPEG capped at max_dim to save cloud disk."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if dest_path.exists() and dest_path.stat().st_size > 256:
        return True
    try:
        img = pil_img
        if img.mode in ("P", "LA", "RGBA") or ("transparency" in img.info):
            rgba = img.convert("RGBA")
            bg = Image.new("RGB", rgba.size, (255, 255, 255))
            bg.paste(rgba, mask=rgba.split()[3])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        w, h = img.size
        if max(w, h) > max_dim:
            scale = max_dim / float(max(w, h))
            img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        img.save(dest_path, format="JPEG", quality=90)
        return True
    except Exception:
        return False


def build_recipe_index_from_hf(cfg: FineTuneConfig, token: str, prune_raw: bool = True) -> dict[str, list[dict]]:
    """Fetch pavankumarpalla/FoodCraft Cleaned_dataset.csv via HF_TOKEN and build a compact index."""
    from huggingface_hub import hf_hub_download

    out_dir = cfg.data_root / "unsloth_foodcraft"
    out_dir.mkdir(parents=True, exist_ok=True)
    index_path = out_dir / "foodcraft_recipe_index.json"
    if index_path.exists() and index_path.stat().st_size > 1000:
        return json.loads(index_path.read_text(encoding="utf-8"))

    raw_dir = cfg.data_root / "raw_datasets" / "foodcraft_recipes"
    raw_dir.mkdir(parents=True, exist_ok=True)
    csv_local = Path(
        hf_hub_download(
            repo_id=cfg.recipe_dataset_repo,
            filename=cfg.recipe_dataset_filename,
            repo_type="dataset",
            local_dir=str(raw_dir),
            token=token,
        )
    )

    print(f"Indexing recipes from {cfg.recipe_dataset_repo} ...", flush=True)
    csv.field_size_limit(min(sys.maxsize, 10_000_000))
    index: dict[str, list[dict]] = {}
    scanned = 0
    max_keys = 15000

    with csv_local.open("r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            scanned += 1
            title = (row.get("title") or "").strip()
            ner_raw = (row.get("NER") or "").strip()
            if not title or not ner_raw:
                continue
            try:
                ner_items = ast.literal_eval(ner_raw)
                if not isinstance(ner_items, list):
                    continue
            except Exception:
                continue
            clean_ner = [str(x).strip().lower() for x in ner_items if str(x).strip()]
            if not clean_ner:
                continue
            entry = {"title": title[:90], "ingredients": clean_ner[:8]}
            for term in clean_ner[:5]:
                if len(term) < 3 or len(term) > 32:
                    continue
                if term not in index:
                    if len(index) >= max_keys:
                        continue
                    index[term] = []
                if len(index[term]) < 3 and all(r["title"] != entry["title"] for r in index[term]):
                    index[term].append(entry)
            if scanned >= 400_000:
                break

    index_path.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    print(f"Indexed {scanned:,} recipes into {len(index):,} keys -> {index_path}")

    if prune_raw:
        shutil.rmtree(raw_dir, ignore_errors=True)
        print("Pruned temporary Cleaned_dataset.csv to save cloud GPU disk space.")

    return index


def stream_cloud_datasets(
    cfg: FineTuneConfig,
    token: str,
    max_per_source: int,
    stages: list[str] | None = None,
    prune_raw: bool = True,
) -> Path:
    """
    Stream Food Craft datasets directly via HF_TOKEN without downloading 40+ GB raw archives.
    Fits easily inside Kaggle's 19.4 GB /kaggle/working limit.
    """
    # Keep HF temporary cache in /tmp on Linux/Kaggle so /kaggle/working stays free
    if Path("/tmp").exists() and os.name != "nt":
        os.environ.setdefault("HF_HOME", "/tmp/hf_cache")

    from datasets import load_dataset
    from huggingface_hub import hf_hub_download

    out_dir = cfg.data_root / "unsloth_foodcraft"
    img_root = out_dir / "images"
    out_dir.mkdir(parents=True, exist_ok=True)
    img_root.mkdir(parents=True, exist_ok=True)

    # Clear leftover bulky raw_datasets from any earlier interrupted full download when pruning
    if prune_raw and (cfg.data_root / "raw_datasets").exists():
        shutil.rmtree(cfg.data_root / "raw_datasets", ignore_errors=True)

    recipe_index = build_recipe_index_from_hf(cfg, token, prune_raw=prune_raw)

    stream_sources = [
        ("indian_foods_15", "bharat-raghunathan/indian-foods-dataset", "dish"),
        ("foodseg103", "EduardoPacheco/FoodSeg103", "foodseg"),
        ("indian_food_20", "rajistics/indian_food_images", "dish"),
        ("food121", "ItsNotRohit/Food121", "dish"),
        ("food_and_vegetables", "SunnyAgarwal4274/Food_and_Vegetables", "produce"),
        ("food_ingredients", "SunnyAgarwal4274/Food_Ingredients", "produce"),
    ]
    if stages:
        stage_set = set(stages)
        stream_sources = [s for s in stream_sources if s[0] in stage_set]

    records: list[dict] = []
    cap = max_per_source if max_per_source > 0 else 4000

    for key, repo_id, mode in stream_sources:
        print(f"\nStreaming {repo_id} (up to {cap:,} samples) via HF_TOKEN ...", flush=True)
        try:
            id2label = None
            if mode == "foodseg":
                id_path = hf_hub_download(repo_id, "id2label.json", repo_type="dataset", token=token)
                id2label = {int(k): v.strip() for k, v in json.loads(Path(id_path).read_text()).items()}

            try:
                ds = load_dataset(repo_id, split="train", streaming=True, token=token)
            except ValueError:
                from datasets import get_dataset_split_names

                avail = get_dataset_split_names(repo_id, token=token)
                chosen_split = avail[0] if avail else "train"
                print(f"  [{key}] 'train' split missing; using '{chosen_split}' instead", flush=True)
                ds = load_dataset(repo_id, split=chosen_split, streaming=True, token=token)
            # Buffer shuffle window so streamed classes aren't biased toward first shard only
            try:
                ds = ds.shuffle(seed=cfg.seed, buffer_size=500)
            except Exception:
                pass

            label_feat = ds.features.get("label") if hasattr(ds, "features") else None
            saved = 0
            for idx, item in enumerate(ds):
                if saved >= cap:
                    break
                img = item.get("image")
                if img is None:
                    continue

                if mode == "foodseg":
                    cls_ids = item.get("classes_on_image") or []
                    labels = [
                        clean_label(id2label[cid])
                        for cid in cls_ids
                        if id2label and cid in id2label and cid not in (0, 103)
                    ]
                    seen = set()
                    labels = [x for x in labels if not (x in seen or seen.add(x))]
                    if not labels:
                        continue
                    is_multi = True
                else:
                    raw_lbl = item.get("label")
                    if raw_lbl is None:
                        continue
                    if isinstance(raw_lbl, int) and label_feat is not None and hasattr(label_feat, "int2str"):
                        lbl_text = label_feat.int2str(raw_lbl)
                    else:
                        lbl_text = str(raw_lbl)
                    labels = [clean_label(lbl_text)]
                    is_multi = False

                dest_img = img_root / key / f"{key}_{saved:05d}.jpg"
                if not save_pil_rgb(img, dest_img, max_dim=768):
                    continue

                records.append({
                    "id": f"{key}_{saved}",
                    "source": key,
                    "split": "train",
                    "labels": labels,
                    "is_multi": is_multi,
                    "mode": mode,
                    "image_path": str(dest_img).replace("\\", "/"),
                })
                saved += 1
                if saved % 1000 == 0:
                    print(f"  [{key}] saved {saved:,}/{cap:,} images ...", flush=True)

            print(f"  [{key}] completed: {saved:,} images", flush=True)
        except Exception as exc:
            print(f"  WARNING: skipped/partial {repo_id}: {exc}", flush=True)

    if not records:
        raise RuntimeError("No training images were streamed from Hugging Face.")

    balanced_jsonl = out_dir / "train_balanced.jsonl"
    random.Random(cfg.seed).shuffle(records)

    with balanced_jsonl.open("w", encoding="utf-8") as out_f:
        for idx, rec in enumerate(records):
            labels = rec["labels"]
            mode = rec["mode"]
            if idx % 3 == 0:
                prompt = (
                    "Analyze this food image for Food Craft and reply ONLY with JSON in this format: "
                    '{"ingredients": ["Item1", "Item2"], "dish": "DishNameOrNone"}.'
                )
                dish_val = "None" if mode == "produce" else labels[0]
                answer = json.dumps({"ingredients": labels, "dish": dish_val}, ensure_ascii=False)
            else:
                if rec["is_multi"]:
                    prompt = INGREDIENT_LIST_PROMPTS[idx % len(INGREDIENT_LIST_PROMPTS)]
                    answer = f"Detected ingredients in this meal: {', '.join(labels)}."
                elif mode == "produce":
                    prompt = PRODUCE_PROMPTS[idx % len(PRODUCE_PROMPTS)]
                    answer = f"Identified ingredient: {labels[0]}."
                else:
                    prompt = SINGLE_DISH_PROMPTS[idx % len(SINGLE_DISH_PROMPTS)]
                    answer = f"Detected food dish: {labels[0]}."

                # Ground against pavankumarpalla/FoodCraft recipe index
                hits = []
                for lbl in labels:
                    kl = lbl.lower().strip()
                    hits = recipe_index.get(kl) or recipe_index.get(kl.rstrip("s")) or []
                    if hits:
                        break
                if hits:
                    rec_strs = [f"{r['title']} ({', '.join(r['ingredients'][:5])})" for r in hits[:2]]
                    answer += f" Matching Food Craft recipes: {'; '.join(rec_strs)}."

            entry = {
                "id": rec["id"],
                "source": rec["source"],
                "labels": labels,
                "image_path": rec["image_path"],
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "image", "image": rec["image_path"]},
                            {"type": "text", "text": prompt},
                        ],
                    },
                    {
                        "role": "assistant",
                        "content": [{"type": "text", "text": answer}],
                    },
                ],
            }
            out_f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"\nPrepared streamed balanced dataset: {len(records):,} images -> {balanced_jsonl}")
    return balanced_jsonl


def build_balanced_from_local(
    source_jsonl: Path,
    dest_jsonl: Path,
    max_per_source: int = 15000,
    seed: int = 3407,
) -> dict:
    """Create balanced JSONL from existing local D:/Food Craft/data/unsloth_foodcraft/."""
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
        sampled = rng.sample(rows, max_per_source) if (max_per_source > 0 and len(rows) > max_per_source) else rows
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
                    {"role": "assistant", "content": [{"type": "text", "text": answer}]},
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Food Craft multimodal dataset using HF_TOKEN")
    parser.add_argument("--hf-token", default=None, help="Hugging Face access token (defaults to HF_TOKEN / .env)")
    parser.add_argument("--stages", nargs="*", default=None, help="Optional subset of stages")
    parser.add_argument("--max-per-source", type=int, default=4000, help="Cap samples per dataset source")
    parser.add_argument("--prune-raw", action="store_true", help="Clean raw downloads/CSV after indexing")
    parser.add_argument("--stream-cloud", action="store_true", help="Stream images from HF without downloading full raw shards")
    parser.add_argument("--full-download", action="store_true", help="Download full raw archives/parquets even on cloud VMs")
    args = parser.parse_args()

    cfg = FineTuneConfig()
    token = resolve_hf_token(args.hf_token)
    if not token:
        raise RuntimeError("HF_TOKEN is required. Set HF_TOKEN in Kaggle/Colab Secrets or backend/.env.")

    local_jsonl = cfg.data_root / "unsloth_foodcraft" / "train_conversations.jsonl"
    free_gb = shutil.disk_usage(cfg.data_root if cfg.data_root.exists() else REPO_ROOT).free / (1024 ** 3)
    is_kaggle_or_tight = bool(os.environ.get("KAGGLE_KERNEL_RUN_TYPE") or Path("/kaggle/working").exists() or free_gb < 45.0)

    if local_jsonl.exists() and not args.stream_cloud and not is_kaggle_or_tight:
        balanced_jsonl = cfg.data_root / "unsloth_foodcraft" / "train_balanced.jsonl"
        stats = build_balanced_from_local(local_jsonl, balanced_jsonl, max_per_source=args.max_per_source, seed=cfg.seed)
        print(json.dumps(stats, indent=2))
        return

    if (args.stream_cloud or is_kaggle_or_tight) and not args.full_download:
        print(f"Using low-disk HF streaming mode (free disk: {free_gb:.2f} GB, cap={args.max_per_source}/source)...")
        stream_cloud_datasets(cfg, token, max_per_source=args.max_per_source, stages=args.stages, prune_raw=True)
        return

    # Full raw archive download mode (for large-disk workstations)
    downloader = REPO_ROOT / "scripts" / "download_foodcraft_vision_dataset.py"
    env = os.environ.copy()
    env["HF_TOKEN"] = token
    cmd = [sys.executable, "-u", str(downloader)]
    if args.stages:
        cmd.extend(["--stages", *args.stages])
    if args.prune_raw:
        cmd.append("--prune-raw")
    subprocess.run(cmd, env=env, cwd=str(REPO_ROOT), check=True)
    balanced_jsonl = cfg.data_root / "unsloth_foodcraft" / "train_balanced.jsonl"
    stats = build_balanced_from_local(local_jsonl, balanced_jsonl, max_per_source=args.max_per_source, seed=cfg.seed)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
