"""
Food Craft Vision Dataset Downloader & Unsloth LLaMA-Vision Formatter
─────────────────────────────────────────────────────────────────────
Downloads curated Hugging Face food, ingredient, fruit/vegetable, and Indian
dish datasets aligned with Food Craft's theme, extracts all images onto D:,
and builds an Unsloth Llama-3.2-Vision conversational JSONL dataset.

Key safeguards:
- Forces HF_HOME / HF_HUB_CACHE onto D:/Food Craft/data/hf_cache (never fills C:)
- Automatically reads optional HF_TOKEN from environment, .env, or backend/.env
- Resumable downloads with retries & exponential backoff on transient errors
- Extracts parquet embedded images & archives sequentially as each stage finishes
"""

from __future__ import annotations

import argparse
import ast
import csv
import io
import json
import os
import sys
import time
import zipfile
from pathlib import Path

# ── Force Hugging Face cache onto D: before importing huggingface_hub ──
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = REPO_ROOT / "data"
HF_CACHE_DIR = DATA_ROOT / "hf_cache"
RAW_DIR = DATA_ROOT / "raw_datasets"
OUT_DIR = DATA_ROOT / "unsloth_foodcraft"
IMAGES_DIR = OUT_DIR / "images"
MANIFEST_PATH = OUT_DIR / "dataset_manifest.json"
RECIPE_INDEX_PATH = OUT_DIR / "foodcraft_recipe_index.json"
CONVERSATIONS_PATH = OUT_DIR / "train_conversations.jsonl"

for d in (DATA_ROOT, HF_CACHE_DIR, HF_CACHE_DIR / "hub", RAW_DIR, OUT_DIR, IMAGES_DIR):
    d.mkdir(parents=True, exist_ok=True)

os.environ["HF_HOME"] = str(HF_CACHE_DIR)
os.environ["HF_HUB_CACHE"] = str(HF_CACHE_DIR / "hub")
os.environ["HF_DATASETS_CACHE"] = str(HF_CACHE_DIR / "datasets")
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = os.environ.get("HF_HUB_ENABLE_HF_TRANSFER", "0")


def load_hf_token() -> str | None:
    """Resolve HF_TOKEN from environment, .env, backend/.env, or HF cache."""
    if os.environ.get("HF_TOKEN"):
        return os.environ["HF_TOKEN"].strip()

    for env_path in (REPO_ROOT / "backend" / ".env", REPO_ROOT / ".env"):
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                if key.strip() == "HF_TOKEN":
                    cleaned = val.strip().strip('"').strip("'")
                    if cleaned:
                        os.environ["HF_TOKEN"] = cleaned
                        return cleaned
    return None


HF_TOKEN = load_hf_token()

import pyarrow.parquet as pq  # noqa: E402
import requests  # noqa: E402
from PIL import Image  # noqa: E402
from huggingface_hub import hf_hub_download, snapshot_download  # noqa: E402


# ── Static Class Maps (from verified dataset schemas) ──────────
INDIAN_FOOD_15_CLASSES = [
    "biryani", "cholebhature", "dabeli", "dal", "dhokla",
    "dosa", "jalebi", "kathiroll", "kofta", "naan",
    "pakora", "paneer", "panipuri", "pavbhaji", "vadapav",
]

INDIAN_FOOD_20_CLASSES = [
    "burger", "butter_naan", "chai", "chapati", "chole_bhature",
    "dal_makhani", "dhokla", "fried_rice", "idli", "jalebi",
    "kaathi_rolls", "kadai_paneer", "kulfi", "masala_dosa", "momos",
    "paani_puri", "pakode", "pav_bhaji", "pizza", "samosa",
]

# Prompt variations for LLaMA-3.2-Vision instruction diversity
SINGLE_DISH_PROMPTS = [
    "Identify the food dish shown in this image for Food Craft meal matching.",
    "What food item or dish is in this photo? Give its clean common name.",
    "Analyze this food image and state what dish or item it depicts.",
]

INGREDIENT_LIST_PROMPTS = [
    "List all visible food ingredients in this image for Food Craft recipe matching.",
    "Identify every distinct ingredient or food component you can see on this plate.",
    "Scan this food photo and return the visible ingredients.",
]

PRODUCE_PROMPTS = [
    "Identify this fruit, vegetable, or cooking ingredient.",
    "What raw food ingredient is pictured here?",
    "Recognize the fruit, vegetable, or pantry ingredient in this image.",
]

DATASET_STAGES = [
    {
        "key": "indian_foods_15",
        "repo_id": "bharat-raghunathan/indian-foods-dataset",
        "kind": "parquet_class",
        "approx_gb": 0.66,
        "description": "15 Indian dishes (biryani, dosa, dal, paneer, naan, etc.)",
    },
    {
        "key": "foodcraft_recipes",
        "repo_id": "pavankumarpalla/FoodCraft",
        "kind": "foodcraft_csv",
        "approx_gb": 2.00,
        "description": "User's own Cleaned_dataset.csv (2.2M+ recipes for multimodal Q&A grounding)",
    },
    {
        "key": "foodseg103",
        "repo_id": "EduardoPacheco/FoodSeg103",
        "kind": "parquet_foodseg",
        "approx_gb": 1.17,
        "description": "103 multi-ingredient plated food images & ingredient lists",
    },
    {
        "key": "indian_food_20",
        "repo_id": "rajistics/indian_food_images",
        "kind": "parquet_class",
        "approx_gb": 1.49,
        "description": "20 Indian & popular dishes (masala_dosa, idli, kadai_paneer, pizza, etc.)",
    },
    {
        "key": "food121",
        "repo_id": "ItsNotRohit/Food121",
        "kind": "parquet_food121",
        "approx_gb": 9.21,
        "description": "Food-101 global cuisines + 20 Indian dish classes (~100k+ images)",
    },
    {
        "key": "food_and_vegetables",
        "repo_id": "SunnyAgarwal4274/Food_and_Vegetables",
        "kind": "image_folders",
        "approx_gb": 1.79,
        "description": "Raw fruits & vegetables in labeled class directories",
    },
    {
        "key": "food_ingredients",
        "repo_id": "SunnyAgarwal4274/Food_Ingredients",
        "kind": "image_folders",
        "approx_gb": 1.86,
        "description": "Cooking ingredients in labeled class directories",
    },
    {
        "key": "vegfru",
        "repo_id": "SEU-VIPGroup/FG-BMK-image-VegFru",
        "kind": "vegfru_zip",
        "approx_gb": 26.06,
        "description": "Fine-grained Vegetables & Fruits large image archive",
    },
]


LOG_FILE = DATA_ROOT / "download.log"


def log(msg: str) -> None:
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with LOG_FILE.open("a", encoding="utf-8") as lf:
            lf.write(line + "\n")
    except OSError:
        pass


def clean_label(raw: str) -> str:
    """Normalize labels like 'masala_dosa' or 'cholebhature' into Title Case."""
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


def retry_call(fn, *args, max_retries: int = 8, **kwargs):
    """Execute a Hugging Face Hub call with exponential backoff on DNS/network drops."""
    delay = 5
    for attempt in range(1, max_retries + 1):
        try:
            return fn(*args, **kwargs)
        except KeyboardInterrupt:
            raise
        except Exception as exc:
            if attempt == max_retries:
                raise
            log(f"Network/HF retry {attempt}/{max_retries} in {delay}s after error: {exc}")
            time.sleep(delay)
            delay = min(delay * 2, 120)


def save_image_bytes(raw_bytes: bytes, dest_path: Path, max_dim: int = 1024) -> bool:
    """Validate and save image bytes as RGB JPEG, resizing huge images to <=1024px."""
    if dest_path.exists() and dest_path.stat().st_size > 256:
        return True
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            if img.mode in ("P", "LA") or (img.mode == "RGBA") or ("transparency" in img.info):
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
            img.save(dest_path, format="JPEG", quality=92)
        return True
    except Exception:
        return False


def download_parquet_dataset(stage: dict) -> Path:
    """Download all parquet files and metadata for a repo into RAW_DIR/<key>."""
    raw_repo_dir = RAW_DIR / stage["key"]
    raw_repo_dir.mkdir(parents=True, exist_ok=True)
    dl_done = raw_repo_dir / ".download.done"

    if not dl_done.exists():
        log(f"Downloading {stage['repo_id']} (~{stage['approx_gb']:.2f} GB) into {raw_repo_dir} ...")
        retry_call(
            snapshot_download,
            repo_id=stage["repo_id"],
            repo_type="dataset",
            local_dir=str(raw_repo_dir),
            token=HF_TOKEN,
            max_workers=2,
        )
        dl_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")
        log(f"Download complete: {stage['repo_id']}")
    else:
        log(f"Raw download already verified: {stage['key']}")
    return raw_repo_dir


def extract_parquet_images(stage: dict, raw_repo_dir: Path) -> list[dict]:
    """Unpack images from parquet shards to IMAGES_DIR/<key>/ and return sample metadata."""
    key = stage["key"]
    meta_jsonl = OUT_DIR / f"{key}_samples.jsonl"
    extract_done = raw_repo_dir / ".extracted.done"

    if extract_done.exists() and meta_jsonl.exists():
        log(f"Extraction already done for {key}, loading cached metadata...")
        with meta_jsonl.open("r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]

    # Determine label maps
    id2label: dict[int, str] = {}
    if stage["kind"] == "parquet_foodseg":
        id_file = raw_repo_dir / "id2label.json"
        if id_file.exists():
            raw_map = json.loads(id_file.read_text(encoding="utf-8"))
            id2label = {int(k): v.strip() for k, v in raw_map.items()}
    elif stage["kind"] == "parquet_food121":
        cls_file = raw_repo_dir / "class_names.txt"
        if cls_file.exists():
            lines = [ln.strip() for ln in cls_file.read_text(encoding="utf-8").splitlines() if ln.strip()]
            id2label = {idx: name for idx, name in enumerate(lines)}
    elif key == "indian_foods_15":
        id2label = {i: n for i, n in enumerate(INDIAN_FOOD_15_CLASSES)}
    elif key == "indian_food_20":
        id2label = {i: n for i, n in enumerate(INDIAN_FOOD_20_CLASSES)}

    parquet_files = sorted(raw_repo_dir.rglob("*.parquet"))
    log(f"Extracting {len(parquet_files)} parquet shard(s) for {key} ...")

    records: list[dict] = []
    img_counter = 0

    for pf in parquet_files:
        split_name = "test" if "test" in pf.stem.lower() else ("validation" if "val" in pf.stem.lower() else "train")
        parquet_table = pq.ParquetFile(pf)

        for batch in parquet_table.iter_batches(batch_size=128):
            cols = batch.to_pydict()
            images_col = cols.get("image", [])

            for row_idx, img_obj in enumerate(images_col):
                raw_bytes = None
                if isinstance(img_obj, dict):
                    raw_bytes = img_obj.get("bytes")
                elif isinstance(img_obj, (bytes, bytearray)):
                    raw_bytes = bytes(img_obj)

                if not raw_bytes:
                    continue

                if stage["kind"] == "parquet_foodseg":
                    cls_ids = cols.get("classes_on_image", [[]])[row_idx] or []
                    labels = [
                        clean_label(id2label[cid])
                        for cid in cls_ids
                        if cid in id2label and cid not in (0, 103)
                    ]
                    # Deduplicate while preserving order
                    seen = set()
                    labels = [x for x in labels if not (x in seen or seen.add(x))]
                    if not labels:
                        continue
                    folder_name = "multi_ingredient"
                    label_payload = labels
                else:
                    raw_lbl = cols.get("label", [None])[row_idx]
                    if raw_lbl is None:
                        continue
                    if isinstance(raw_lbl, int) and raw_lbl in id2label:
                        lbl_name = clean_label(id2label[raw_lbl])
                    else:
                        lbl_name = clean_label(str(raw_lbl))
                    folder_name = lbl_name.lower().replace(" ", "_")
                    label_payload = [lbl_name]

                out_img = IMAGES_DIR / key / split_name / folder_name / f"{key}_{img_counter:06d}.jpg"
                if save_image_bytes(raw_bytes, out_img):
                    records.append({
                        "image_path": str(out_img).replace("\\", "/"),
                        "labels": label_payload,
                        "split": split_name,
                        "source": key,
                        "is_multi": stage["kind"] == "parquet_foodseg",
                    })
                    img_counter += 1

        log(f"  [{key}] processed {pf.name} -> {img_counter:,} images so far")

    with meta_jsonl.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    extract_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")
    log(f"Finished extracting {key}: {len(records):,} images")
    return records


def download_file_resumable(url: str, dest_path: Path, token: str | None, tag: str) -> Path:
    """Download a large file via HTTP Range requests, flushing chunks straight to disk."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if dest_path.exists() and dest_path.stat().st_size > 0:
        return dest_path

    part_path = dest_path.with_name(dest_path.name + ".part")
    base_headers = {"Authorization": f"Bearer {token}"} if token else {}

    # Query expected file size first
    head_resp = retry_call(requests.get, url, headers={**base_headers, "Range": "bytes=0-0"}, stream=True, timeout=30)
    content_range = head_resp.headers.get("Content-Range", "")
    head_resp.close()
    total_bytes = int(content_range.split("/")[-1]) if "/" in content_range else 0
    if total_bytes == 0:
        raise RuntimeError(f"Could not determine total file size for {url} (Content-Range={content_range!r})")

    attempt = 0
    max_attempts = 40
    while True:
        existing = part_path.stat().st_size if part_path.exists() else 0
        if existing >= total_bytes:
            break

        headers = {**base_headers, "Range": f"bytes={existing}-"}
        try:
            with requests.get(url, headers=headers, stream=True, timeout=(30, 120)) as resp:
                if resp.status_code == 416:
                    existing = part_path.stat().st_size if part_path.exists() else 0
                    if existing >= total_bytes:
                        break
                    raise RuntimeError(f"HTTP 416 at offset {existing} / {total_bytes}")
                resp.raise_for_status()

                mode = "ab" if resp.status_code == 206 and existing > 0 else "wb"
                if mode == "wb":
                    existing = 0

                bytes_since_log = 0
                t_start = time.time()
                session_bytes = 0

                with part_path.open(mode) as fh:
                    for chunk in resp.iter_content(chunk_size=4 * 1024 * 1024):
                        if not chunk:
                            continue
                        fh.write(chunk)
                        fh.flush()
                        clen = len(chunk)
                        existing += clen
                        session_bytes += clen
                        bytes_since_log += clen

                        if bytes_since_log >= 128 * 1024 * 1024 or existing >= total_bytes:
                            elapsed = max(time.time() - t_start, 0.1)
                            speed_mb = (session_bytes / (1024 ** 2)) / elapsed
                            pct = (existing / total_bytes) * 100.0
                            eta_hr = ((total_bytes - existing) / max(speed_mb * 1024 ** 2, 1.0)) / 3600.0
                            log(
                                f"  [{tag}] {existing / (1024**3):.2f} / {total_bytes / (1024**3):.2f} GB "
                                f"({pct:.1f}%) @ {speed_mb:.2f} MB/s | ETA {eta_hr:.2f}h"
                            )
                            bytes_since_log = 0
                            attempt = 0  # Reset consecutive error counter after healthy progress
        except KeyboardInterrupt:
            raise
        except Exception as exc:
            attempt += 1
            if attempt > max_attempts:
                raise RuntimeError(f"Exceeded {max_attempts} resume attempts for {dest_path.name}: {exc}") from exc
            wait_s = min(5 * (2 ** min(attempt - 1, 4)), 60)
            cur_gb = (part_path.stat().st_size / (1024 ** 3)) if part_path.exists() else 0.0
            log(f"  [{tag}] stream interrupted at {cur_gb:.2f} GB; retrying in {wait_s}s ({attempt}/{max_attempts}): {exc}")
            time.sleep(wait_s)

    part_path.replace(dest_path)
    return dest_path


def process_vegfru_stage(stage: dict) -> list[dict]:
    """Download VegFru metadata + 26GB zip archive and extract labeled produce images."""
    key = stage["key"]
    raw_repo_dir = RAW_DIR / key
    meta_dir = RAW_DIR / "fg_bmk_vegfru_meta"
    raw_repo_dir.mkdir(parents=True, exist_ok=True)
    meta_dir.mkdir(parents=True, exist_ok=True)

    meta_jsonl = OUT_DIR / f"{key}_samples.jsonl"
    extract_done = raw_repo_dir / ".extracted.done"
    if extract_done.exists() and meta_jsonl.exists():
        log("VegFru already extracted, loading cached metadata...")
        with meta_jsonl.open("r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]

    # 1. Fetch tiny VegFru class/split metadata from SEU-VIPGroup/FG-BMK first
    for mf in (
        "benchmark/machine-oriented/vegfru/classes.txt",
        "benchmark/machine-oriented/vegfru/train.csv",
        "benchmark/machine-oriented/vegfru/test.csv",
    ):
        local_meta = meta_dir / mf
        if not local_meta.exists():
            log(f"Downloading VegFru metadata: {mf}")
            retry_call(
                hf_hub_download,
                repo_id="SEU-VIPGroup/FG-BMK",
                filename=mf,
                repo_type="dataset",
                local_dir=str(meta_dir),
                token=HF_TOKEN,
            )

    # 2. Download vegfru.zip (26.06 GB) via true byte-range HTTP streaming (avoids Xet 26GB expiry bugs)
    zip_path = raw_repo_dir / "vegfru.zip"
    dl_done = raw_repo_dir / ".download.done"
    if not dl_done.exists() or not zip_path.exists():
        log(f"Downloading {stage['repo_id']}/vegfru.zip (~26.06 GB) via byte-range resume into {raw_repo_dir} ...")
        zip_url = f"https://huggingface.co/datasets/{stage['repo_id']}/resolve/main/vegfru.zip"
        download_file_resumable(zip_url, zip_path, HF_TOKEN, tag=key)
        dl_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")

    # 3. Extract vegfru.zip to IMAGES_DIR/vegfru
    vegfru_out = IMAGES_DIR / key
    vegfru_out.mkdir(parents=True, exist_ok=True)
    unzip_done = raw_repo_dir / ".unzip.done"
    if not unzip_done.exists():
        log(f"Extracting {zip_path} to {vegfru_out} ...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(vegfru_out)
        unzip_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")

    # 4. Build metadata lookup from CSVs (no header row in FG-BMK vegfru train/test CSVs)
    path_to_label: dict[str, tuple[str, str]] = {}
    classes_file = meta_dir / "benchmark" / "machine-oriented" / "vegfru" / "classes.txt"
    classes_list = []
    if classes_file.exists():
        classes_list = [ln.strip() for ln in classes_file.read_text(encoding="utf-8", errors="ignore").splitlines() if ln.strip()]

    for csv_name in ("train.csv", "test.csv"):
        split_label = "test" if csv_name.startswith("test") else "train"
        csv_path = meta_dir / "benchmark" / "machine-oriented" / "vegfru" / csv_name
        if csv_path.exists():
            for line in csv_path.read_text(encoding="utf-8", errors="ignore").splitlines():
                parts = [p.strip() for p in line.split(",")]
                if len(parts) < 2 or parts[0].lower() in ("path", "image", "file", "filename"):
                    continue
                rel = parts[0].replace("\\", "/").lstrip("./")
                lbl_raw = parts[1]
                if lbl_raw.isdigit() and int(lbl_raw) < len(classes_list):
                    lbl_raw = classes_list[int(lbl_raw)]
                clean_lbl = clean_label(lbl_raw)
                path_to_label[rel] = (clean_lbl, split_label)

    records: list[dict] = []
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    for img_path in vegfru_out.rglob("*"):
        if not img_path.is_file() or img_path.suffix.lower() not in valid_exts:
            continue
        rel_str = str(img_path.relative_to(vegfru_out)).replace("\\", "/")
        match = path_to_label.get(rel_str)
        if not match:
            # Handle optional top-level archive folder (e.g. vegfru/veg200_images/...)
            tail3 = "/".join(Path(rel_str).parts[-3:])
            match = path_to_label.get(tail3)
        if match:
            lbl, split_name = match
        else:
            lbl = clean_label(img_path.parent.name)
            split_name = "test" if "/test/" in f"/{rel_str.lower()}/" else "train"
        records.append({
            "image_path": str(img_path).replace("\\", "/"),
            "labels": [lbl],
            "split": split_name,
            "source": key,
            "is_multi": False,
        })

    with meta_jsonl.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    extract_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")
    log(f"Finished VegFru indexing: {len(records):,} images")
    return records


def process_image_folder_stage(stage: dict) -> list[dict]:
    """Download folder-based image datasets and index images in place (no duplicate copy)."""
    key = stage["key"]
    target_dir = IMAGES_DIR / key
    target_dir.mkdir(parents=True, exist_ok=True)
    meta_jsonl = OUT_DIR / f"{key}_samples.jsonl"
    dl_done = target_dir / ".download.done"

    if dl_done.exists() and meta_jsonl.exists():
        log(f"{key} already downloaded & indexed.")
        with meta_jsonl.open("r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]

    log(f"Downloading {stage['repo_id']} (~{stage['approx_gb']:.2f} GB) directly into {target_dir} ...")
    retry_call(
        snapshot_download,
        repo_id=stage["repo_id"],
        repo_type="dataset",
        local_dir=str(target_dir),
        token=HF_TOKEN,
        max_workers=8,
    )
    dl_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")

    records: list[dict] = []
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    for img_path in target_dir.rglob("*"):
        if not img_path.is_file() or img_path.suffix.lower() not in valid_exts:
            continue
        lbl = clean_label(img_path.parent.name)
        rel = str(img_path.relative_to(target_dir)).replace("\\", "/").lower()
        split_name = "test" if rel.startswith("test/") else ("validation" if rel.startswith(("val/", "validation/")) else "train")
        records.append({
            "image_path": str(img_path).replace("\\", "/"),
            "labels": [lbl],
            "split": split_name,
            "source": key,
            "is_multi": False,
        })

    with meta_jsonl.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    log(f"Indexed {key}: {len(records):,} images")
    return records


def process_foodcraft_csv_stage(stage: dict) -> dict[str, list[dict]]:
    """Download pavankumarpalla/FoodCraft (Cleaned_dataset.csv) and build a compact recipe index."""
    key = stage["key"]
    raw_repo_dir = RAW_DIR / key
    raw_repo_dir.mkdir(parents=True, exist_ok=True)
    csv_path = raw_repo_dir / "Cleaned_dataset.csv"
    dl_done = raw_repo_dir / ".download.done"
    idx_done = raw_repo_dir / ".indexed.done"

    if not dl_done.exists() or not csv_path.exists():
        log(f"Downloading {stage['repo_id']}/Cleaned_dataset.csv (~2.00 GB) into {raw_repo_dir} ...")
        retry_call(
            hf_hub_download,
            repo_id=stage["repo_id"],
            filename="Cleaned_dataset.csv",
            repo_type="dataset",
            local_dir=str(raw_repo_dir),
            token=HF_TOKEN,
        )
        dl_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")
        log("Download complete: pavankumarpalla/FoodCraft Cleaned_dataset.csv")

    if idx_done.exists() and RECIPE_INDEX_PATH.exists():
        log("FoodCraft recipe index already built, loading cached index...")
        return json.loads(RECIPE_INDEX_PATH.read_text(encoding="utf-8"))

    log("Indexing recipes & NER ingredients from Cleaned_dataset.csv ...")
    csv.field_size_limit(min(sys.maxsize, 10_000_000))
    index: dict[str, list[dict]] = {}
    scanned = 0
    max_keys = 25000

    dish_phrases = tuple(
        sorted({
            *(n.replace("_", " ") for n in INDIAN_FOOD_15_CLASSES),
            *(n.replace("_", " ") for n in INDIAN_FOOD_20_CLASSES),
            "chole bhature", "masala dosa", "dal makhani", "kadai paneer", "butter naan",
            "pani puri", "pav bhaji", "vada pav", "kathi roll", "paneer butter masala",
            "chicken curry", "fried rice", "caesar salad", "apple pie", "garlic bread",
        })
    )

    with csv_path.open("r", encoding="utf-8", errors="ignore", newline="") as f:
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
            keys_to_add = [t for t in clean_ner[:6] if 3 <= len(t) <= 32]
            title_l = title.lower()
            for dp in dish_phrases:
                if dp in title_l:
                    keys_to_add.append(dp)

            for term in keys_to_add:
                if term not in index:
                    if len(index) >= max_keys:
                        continue
                    index[term] = []
                if len(index[term]) < 3 and all(r["title"] != entry["title"] for r in index[term]):
                    index[term].append(entry)

            if scanned % 250_000 == 0:
                log(f"  [foodcraft_recipes] scanned {scanned:,} recipes, indexed {len(index):,} ingredient/dish keys")

    RECIPE_INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    idx_done.write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")
    log(f"Indexed {scanned:,} FoodCraft recipes across {len(index):,} ingredient/dish keys.")
    return index


def load_recipe_index() -> dict[str, list[dict]]:
    if RECIPE_INDEX_PATH.exists():
        try:
            return json.loads(RECIPE_INDEX_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def build_unsloth_conversations(all_records: list[dict], recipe_index: dict[str, list[dict]] | None = None) -> None:
    """Convert all indexed image records into Unsloth Llama-3.2-Vision messages JSONL."""
    if recipe_index is None:
        recipe_index = load_recipe_index()
    log(f"Writing Unsloth conversations JSONL -> {CONVERSATIONS_PATH} (recipe index keys={len(recipe_index):,}) ...")
    count = 0
    with CONVERSATIONS_PATH.open("w", encoding="utf-8") as out_f:
        for idx, rec in enumerate(all_records):
            labels = rec.get("labels", [])
            if not labels:
                continue

            src = rec["source"]
            # Check if pavankumarpalla/FoodCraft has recipe matches for any detected label
            matched_recipes: list[dict] = []
            if recipe_index:
                for lbl in labels:
                    key_l = lbl.lower().strip()
                    hits = recipe_index.get(key_l) or recipe_index.get(key_l.rstrip("s")) or []
                    for h in hits:
                        if h not in matched_recipes:
                            matched_recipes.append(h)
                        if len(matched_recipes) >= 2:
                            break
                    if len(matched_recipes) >= 2:
                        break

            if rec.get("is_multi"):
                prompt = INGREDIENT_LIST_PROMPTS[idx % len(INGREDIENT_LIST_PROMPTS)]
                answer = (
                    f"Detected ingredients in this meal: {', '.join(labels)}. "
                    f"You can match recipes using: {', '.join(labels)}."
                )
            elif src in ("vegfru", "food_and_vegetables", "food_ingredients"):
                prompt = PRODUCE_PROMPTS[idx % len(PRODUCE_PROMPTS)]
                answer = f"Identified ingredient: {labels[0]}."
            else:
                prompt = SINGLE_DISH_PROMPTS[idx % len(SINGLE_DISH_PROMPTS)]
                answer = f"Detected food dish: {labels[0]}."

            if matched_recipes:
                rec_strs = [f"{r['title']} ({', '.join(r['ingredients'][:5])})" for r in matched_recipes]
                answer += f" Matching Food Craft recipes: {'; '.join(rec_strs)}."

            entry = {
                "id": f"{src}_{idx}",
                "source": src,
                "split": rec.get("split", "train"),
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
                        "content": [
                            {"type": "text", "text": answer},
                        ],
                    },
                ],
            }
            out_f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            count += 1
    log(f"Built {count:,} Unsloth training conversation records.")


def folder_size_gb(path: Path) -> float:
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except OSError:
                pass
    return round(total / (1024 ** 3), 3)


def update_manifest(stage_stats: dict) -> None:
    manifest = {
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "hf_token_configured": bool(HF_TOKEN),
        "data_root": str(DATA_ROOT),
        "images_dir": str(IMAGES_DIR),
        "conversations_jsonl": str(CONVERSATIONS_PATH),
        "disk_usage_gb": {
            "images_extracted_gb": folder_size_gb(IMAGES_DIR),
            "raw_datasets_gb": folder_size_gb(RAW_DIR),
            "hf_cache_gb": folder_size_gb(HF_CACHE_DIR),
            "total_data_dir_gb": folder_size_gb(DATA_ROOT),
        },
        "stages": stage_stats,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download Food Craft ~42-50GB datasets and format for Unsloth")
    parser.add_argument(
        "--stages",
        nargs="*",
        default=None,
        help="Optional subset of stage keys (e.g. indian_foods_15 foodseg103). Defaults to all 7.",
    )
    parser.add_argument(
        "--rebuild-only",
        action="store_true",
        help="Only rebuild train_conversations.jsonl from already extracted sample JSONLs.",
    )
    parser.add_argument(
        "--prune-raw",
        action="store_true",
        help="After verified extraction of a parquet/zip stage, remove its raw_datasets archive to avoid double disk usage.",
    )
    args = parser.parse_args()

    log("=" * 64)
    log("Food Craft Dataset Pipeline (Target: ~44.2 GB download -> ~52+ GB images & recipes)")
    log(f"Data root: {DATA_ROOT}")
    log(f"HF_TOKEN configured: {'YES' if HF_TOKEN else 'NO (unauthenticated, slower rate limit)'}")
    log("=" * 64)

    all_records: list[dict] = []
    stage_stats: dict = {}
    recipe_index: dict[str, list[dict]] = load_recipe_index()

    if args.rebuild_only:
        for mf in sorted(OUT_DIR.glob("*_samples.jsonl")):
            with mf.open("r", encoding="utf-8") as f:
                recs = [json.loads(line) for line in f if line.strip()]
            all_records.extend(recs)
            stage_stats[mf.stem.replace("_samples", "")] = {"images": len(recs)}
        build_unsloth_conversations(all_records, recipe_index)
        update_manifest(stage_stats)
        return

    selected_keys = set(args.stages) if args.stages else None

    for stage in DATASET_STAGES:
        key = stage["key"]
        if selected_keys is not None and key not in selected_keys:
            continue

        log(f"\n--- Stage: {key} ({stage['repo_id']}, ~{stage['approx_gb']:.2f} GB) ---")
        try:
            if stage["kind"] == "foodcraft_csv":
                recipe_index = process_foodcraft_csv_stage(stage)
                stage_stats[key] = {
                    "repo_id": stage["repo_id"],
                    "indexed_keys": len(recipe_index),
                    "status": "completed",
                }
                if all_records:
                    build_unsloth_conversations(all_records, recipe_index)
                update_manifest(stage_stats)
                continue

            if stage["kind"].startswith("parquet"):
                raw_dir = download_parquet_dataset(stage)
                recs = extract_parquet_images(stage, raw_dir)
                if args.prune_raw and (raw_dir / ".extracted.done").exists():
                    for pf in raw_dir.rglob("*.parquet"):
                        pf.unlink(missing_ok=True)
            elif stage["kind"] == "vegfru_zip":
                recs = process_vegfru_stage(stage)
                if args.prune_raw and ((RAW_DIR / key) / ".extracted.done").exists():
                    zip_p = RAW_DIR / key / "vegfru.zip"
                    zip_p.unlink(missing_ok=True)
            else:
                recs = process_image_folder_stage(stage)

            all_records.extend(recs)
            stage_stats[key] = {
                "repo_id": stage["repo_id"],
                "images": len(recs),
                "status": "completed",
            }
            # Incrementally refresh manifest & JSONL after each stage completes
            build_unsloth_conversations(all_records, recipe_index)
            update_manifest(stage_stats)
        except Exception as exc:
            log(f"ERROR in stage {key}: {exc}")
            stage_stats[key] = {"repo_id": stage["repo_id"], "status": "failed", "error": str(exc)}
            update_manifest(stage_stats)

    log("Pipeline run finished.")


if __name__ == "__main__":
    main()
