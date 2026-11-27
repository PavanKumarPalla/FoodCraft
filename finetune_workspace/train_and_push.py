"""
Food Craft Fine-Tune Workspace — Unsloth Training & Error-Proof Hugging Face Push
────────────────────────────────────────────────────────────────────────────────
Pre-flight checks GPU, disk space, and HF_TOKEN write permissions BEFORE training,
fine-tunes unsloth/Llama-3.2-11B-Vision-Instruct-bnb-4bit lazily over Food Craft
images + recipe data, fixes missing Mllama processor files, and uploads LoRA +
merged 16-bit weights shard-by-shard with retries to avoid push failures.
"""

from __future__ import annotations

import argparse
import gc
import json
import os
import shutil
import sys
import time
from pathlib import Path

# Prevent Unsloth/bitsandbytes multi-GPU DataParallel crash on Kaggle T4 x2
if "CUDA_VISIBLE_DEVICES" not in os.environ:
    os.environ["CUDA_VISIBLE_DEVICES"] = "0"

# Route HF base-model download cache to /tmp on Linux/Kaggle before importing huggingface_hub
if Path("/tmp").exists() and os.name != "nt":
    os.environ.setdefault("HF_HOME", "/tmp/hf_cache")

from huggingface_hub import HfApi, hf_hub_download
from PIL import Image

from config import FineTuneConfig, resolve_hf_token

MLLAMA_REQUIRED_FILES = (
    "preprocessor_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    "chat_template.json",
)


def check_write_access(api: HfApi, repo_ids: list[str]) -> None:
    """Fail immediately before training if HF_TOKEN cannot create/write model repos."""
    who = api.whoami()
    username = who.get("name", "unknown")
    auth_info = who.get("auth", {}).get("accessToken", {})
    role = auth_info.get("role", "unknown")
    print(f"HF Authenticated user: {username} (token role: {role})")

    for repo_id in repo_ids:
        try:
            api.create_repo(repo_id=repo_id, repo_type="model", exist_ok=True)
            print(f"HF Hub write check OK: https://huggingface.co/{repo_id}")
        except Exception as exc:
            raise PermissionError(
                f"HF_TOKEN cannot create/write to '{repo_id}'.\n"
                f"Details: {exc}\n"
                "Fix: Go to https://huggingface.co/settings/tokens and grant your token "
                "'Write' permissions under your namespace (repo.write / write role), "
                "update HF_TOKEN, and re-run."
            ) from exc


def get_system_ram_gb() -> float:
    """Return total host RAM in GB (cross-platform) to guard against 16-bit merge OOM."""
    try:
        meminfo = Path("/proc/meminfo")
        if meminfo.exists():
            for line in meminfo.read_text(encoding="utf-8").splitlines():
                if line.startswith("MemTotal:"):
                    kb = int(line.split()[1])
                    return round(kb / (1024 ** 2), 2)
    except Exception:
        pass
    return 32.0


def preflight_check(
    cfg: FineTuneConfig,
    token: str | None,
    push_merged: bool,
    save_method: str = "auto",
    skip_hf_check: bool = False,
) -> tuple[HfApi | None, dict]:
    """Verify CUDA GPU, HF write permission, and disk space before burning compute."""
    import torch

    if not torch.cuda.is_available():
        raise RuntimeError(
            "No NVIDIA CUDA GPU detected. Unsloth Llama-3.2-11B-Vision training requires a CUDA GPU "
            "(>=15 GB VRAM, e.g. Kaggle T4 x2, Google Colab T4/L4/A100, or RunPod)."
        )

    gpu_name = torch.cuda.get_device_name(0)
    vram_gb = round(torch.cuda.get_device_properties(0).total_memory / (1024 ** 3), 2)
    ram_gb = get_system_ram_gb()
    usage = shutil.disk_usage(cfg.output_dir.parent)
    free_gb = round(usage.free / (1024 ** 3), 2)

    resolved_method = save_method
    if save_method == "auto":
        if ram_gb >= 22.0 and free_gb >= 38.0:
            resolved_method = "merged_16bit"
        elif free_gb >= 9.0:
            resolved_method = "merged_4bit_forced"
        else:
            resolved_method = "lora_only"

    min_free = 36.0 if (push_merged and resolved_method == "merged_16bit") else (8.5 if (push_merged and resolved_method == "merged_4bit_forced") else 3.0)

    print(
        f"GPU: {gpu_name} ({vram_gb} GB VRAM) | Host RAM: {ram_gb} GB | "
        f"Free disk: {free_gb} GB | Save method: {resolved_method}"
    )
    if vram_gb < 14.0:
        print(f"WARNING: Only {vram_gb} GB VRAM detected; 4-bit Llama-3.2-11B-Vision typically needs >=14.5 GB.")

    # Verify HF write access BEFORE checking strict merged disk threshold so 403 errors fail fast
    api = None
    if not skip_hf_check:
        if not token:
            raise RuntimeError("HF_TOKEN is required to push model to Hugging Face Hub.")
        api = HfApi(token=token)
        targets = [cfg.hub_lora_repo]
        if push_merged and resolved_method != "lora_only":
            targets.append(cfg.hub_model_repo)
        check_write_access(api, targets)

    if push_merged and resolved_method == "merged_4bit_forced" and save_method == "auto":
        print(
            f"NOTE: Free disk ({free_gb} GB) / RAM ({ram_gb} GB) fits 'merged_4bit_forced' (~7 GB) "
            "instead of 'merged_16bit' (~20 GB); switching automatically so Kaggle/Colab won't run out of disk."
        )
    elif push_merged and resolved_method == "lora_only":
        print(f"NOTE: Free disk ({free_gb} GB) is tight; will push LoRA adapter (~250 MB) cleanly without merged weights.")

    if free_gb < min_free:
        raise RuntimeError(f"Insufficient free disk ({free_gb} GB). Need at least {min_free} GB for safe save/push.")

    return api, {"gpu": gpu_name, "vram_gb": vram_gb, "ram_gb": ram_gb, "free_gb": free_gb, "save_method": resolved_method}


def load_rows(jsonl_path: Path, max_samples: int | None = None) -> list[dict]:
    """Load training rows from JSONL without loading images into RAM."""
    if not jsonl_path.exists():
        raise FileNotFoundError(f"Training JSONL not found: {jsonl_path}. Run prepare_dataset.py first.")
    rows: list[dict] = []
    with jsonl_path.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            row = json.loads(line)
            if Path(row["image_path"]).exists():
                rows.append(row)
                if max_samples and len(rows) >= max_samples:
                    break
    if not rows:
        raise RuntimeError(f"No valid existing image paths found in {jsonl_path}")
    return rows


def make_lazy_dataset(rows: list[dict], max_dim: int = 560):
    """Create a torch Dataset loading PIL RGB images lazily batch-by-batch."""
    from torch.utils.data import Dataset

    class LazyFoodVisionDataset(Dataset):
        def __init__(self, items: list[dict], dim_limit: int):
            self.items = items
            self.dim_limit = dim_limit

        def __len__(self) -> int:
            return len(self.items)

        def __getitem__(self, idx: int) -> dict:
            row = self.items[idx]
            with Image.open(row["image_path"]) as im:
                rgb = im.convert("RGB")
                w, h = rgb.size
                if max(w, h) > self.dim_limit:
                    scale = self.dim_limit / float(max(w, h))
                    rgb = rgb.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
                pil_img = rgb.copy()

            rebuilt = []
            for turn in row["messages"]:
                content = []
                for blk in turn["content"]:
                    if blk.get("type") == "image":
                        content.append({"type": "image", "image": pil_img})
                    else:
                        content.append({"type": "text", "text": blk["text"]})
                rebuilt.append({"role": turn["role"], "content": content})
            return {"messages": rebuilt}

    return LazyFoodVisionDataset(rows, max_dim)


def ensure_mllama_processor_files(export_dir: Path, base_repo: str, token: str | None) -> None:
    """
    Prevent `OSError: Can't load tokenizer / preprocessor_config.json` when serving
    fine-tuned Llama-3.2-Vision models with Transformers / vLLM / Inference Endpoints.
    """
    for fname in MLLAMA_REQUIRED_FILES:
        target = export_dir / fname
        if target.exists() and target.stat().st_size > 0:
            continue
        try:
            downloaded = hf_hub_download(
                repo_id=base_repo,
                filename=fname,
                repo_type="model",
                token=token,
            )
            shutil.copy2(downloaded, target)
            print(f"Patched missing Mllama file from {base_repo}: {fname}")
        except Exception as exc:
            print(f"Note: optional base processor file {fname} not patched ({exc})")


def write_model_card(export_dir: Path, cfg: FineTuneConfig, sample_count: int, is_lora: bool) -> None:
    kind = "LoRA Adapter" if is_lora else "Merged 16-bit Model"
    card = f"""---
base_model: {cfg.base_unquantized_id}
library_name: transformers
pipeline_tag: image-text-to-text
tags:
  - unsloth
  - llama-3.2-vision
  - food-recognition
  - foodcraft
  - indian-food
license: llama3.2
---

# {cfg.hub_lora_repo if is_lora else cfg.hub_model_repo} ({kind})

Fine-tuned with **Unsloth** on **{sample_count:,}** Food Craft multimodal food, ingredient, fruit/vegetable, and Indian meal images grounded against `pavankumarpalla/FoodCraft`.
"""
    (export_dir / "README.md").write_text(card, encoding="utf-8")


def upload_folder_resilient(api: HfApi, local_dir: Path, repo_id: str, commit_prefix: str) -> None:
    """
    Upload small config files first, then upload each large weight shard individually
    with retries so multi-GB model pushes never hit single-commit timeouts or LFS errors.
    """
    small_patterns = ["*.json", "*.md", "*.txt", "*.model", "*.jinja", "*.py"]
    api.upload_folder(
        repo_id=repo_id,
        folder_path=str(local_dir),
        repo_type="model",
        allow_patterns=small_patterns,
        commit_message=f"{commit_prefix}: configs & tokenizer",
    )

    weight_files = sorted(
        p for p in local_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in {".safetensors", ".bin", ".pt"}
    )
    for idx, wf in enumerate(weight_files, 1):
        rel = str(wf.relative_to(local_dir)).replace("\\", "/")
        size_gb = wf.stat().st_size / (1024 ** 3)
        delay = 5
        for attempt in range(1, 7):
            try:
                print(f"Uploading shard {idx}/{len(weight_files)}: {rel} ({size_gb:.2f} GB) ...", flush=True)
                api.upload_file(
                    path_or_fileobj=str(wf),
                    path_in_repo=rel,
                    repo_id=repo_id,
                    repo_type="model",
                    commit_message=f"{commit_prefix}: upload {rel}",
                )
                break
            except Exception as exc:
                if attempt == 6:
                    raise RuntimeError(f"Failed uploading shard {rel} after retries: {exc}") from exc
                print(f"Shard upload retry {attempt}/6 in {delay}s: {exc}", flush=True)
                time.sleep(delay)
                delay = min(delay * 2, 120)

    print(f"Successfully pushed model to https://huggingface.co/{repo_id}")


def export_and_push_lora(
    api: HfApi,
    model,
    tokenizer,
    cfg: FineTuneConfig,
    token: str | None,
    export_dir: Path,
    sample_count: int,
    commit_prefix: str,
) -> None:
    """Save LoRA adapter locally, patch Mllama processor files, and push to HF Hub."""
    export_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(export_dir))
    tokenizer.save_pretrained(str(export_dir))
    ensure_mllama_processor_files(export_dir, cfg.base_unquantized_id, token)
    write_model_card(export_dir, cfg, sample_count, is_lora=True)
    upload_folder_resilient(api, export_dir, cfg.hub_lora_repo, commit_prefix)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train Food Craft Llama-3.2-Vision and push cleanly to Hugging Face")
    parser.add_argument("--hf-token", default=None, help="Hugging Face Write token")
    parser.add_argument("--jsonl", type=Path, default=None, help="Path to train_balanced.jsonl or train_conversations.jsonl")
    parser.add_argument("--max-samples", type=int, default=None, help="Limit samples for fast runs")
    parser.add_argument("--max-steps", type=int, default=150, help="Training steps (-1 to run full --epochs)")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--hub-repo", default=None, help="Override merged HF Hub repo (e.g. pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision)")
    parser.add_argument("--lora-repo", default=None, help="Override LoRA HF Hub repo")
    parser.add_argument("--push-merged", action="store_true", help="Also merge model locally and upload shards to HF Hub")
    parser.add_argument(
        "--push-checkpoint",
        type=Path,
        default=None,
        help="Directly push an existing saved LoRA checkpoint (e.g. checkpoint-200) to HF Hub without retraining",
    )
    parser.add_argument(
        "--resume-from-checkpoint",
        default=None,
        help="Path to checkpoint dir or 'auto' to resume training from latest saved step",
    )
    parser.add_argument(
        "--save-method",
        choices=["auto", "merged_16bit", "merged_4bit_forced", "lora_only"],
        default="auto",
        help="Merge precision ('auto' checks RAM + free disk so Kaggle 19GB / Colab 12GB never OOM or fill disk)",
    )
    parser.add_argument("--preflight-only", action="store_true", help="Only run GPU/disk/HF write permission checks")
    args = parser.parse_args()

    cfg = FineTuneConfig()
    if args.hub_repo:
        cfg.hub_model_repo = args.hub_repo
    if args.lora_repo:
        cfg.hub_lora_repo = args.lora_repo
    cfg.output_dir.mkdir(parents=True, exist_ok=True)

    token = resolve_hf_token(args.hf_token)
    api, env_info = preflight_check(cfg, token, push_merged=args.push_merged, save_method=args.save_method)
    if args.preflight_only:
        print("Preflight checks passed cleanly.")
        return

    # Fast recovery mode: push an already-trained checkpoint (e.g. checkpoint-200) directly to HF Hub
    if args.push_checkpoint:
        ckpt_path = args.push_checkpoint
        if not ckpt_path.exists():
            raise FileNotFoundError(f"Checkpoint directory not found: {ckpt_path}")

        import unsloth  # noqa: F401
        from unsloth import FastVisionModel

        print(f"Loading fine-tuned checkpoint directly from {ckpt_path} ...", flush=True)
        model, tokenizer = FastVisionModel.from_pretrained(
            str(ckpt_path),
            load_in_4bit=True,
            token=token,
        )
        assert api is not None
        export_and_push_lora(
            api,
            model,
            tokenizer,
            cfg,
            token,
            cfg.output_dir / "lora_adapter",
            0,
            "FoodCraft Llama-3.2-Vision LoRA (recovered checkpoint)",
        )

        if args.push_merged and env_info["save_method"] != "lora_only":
            save_method = env_info["save_method"]
            merged_dir = cfg.output_dir / save_method
            merged_dir.mkdir(parents=True, exist_ok=True)
            print(f"Merging checkpoint ({save_method}) into {merged_dir} ...", flush=True)
            model.save_pretrained_merged(str(merged_dir), tokenizer, save_method=save_method)
            ensure_mllama_processor_files(merged_dir, cfg.base_unquantized_id, token)
            write_model_card(merged_dir, cfg, 0, is_lora=False)
            upload_folder_resilient(api, merged_dir, cfg.hub_model_repo, f"FoodCraft Llama-3.2-Vision ({save_method})")
        return

    default_balanced = cfg.data_root / "unsloth_foodcraft" / "train_balanced.jsonl"
    default_full = cfg.data_root / "unsloth_foodcraft" / "train_conversations.jsonl"
    jsonl_path = args.jsonl or (default_balanced if default_balanced.exists() else default_full)
    rows = load_rows(jsonl_path, max_samples=args.max_samples)
    print(f"Loaded {len(rows):,} vision training records from {jsonl_path}")

    train_dataset = make_lazy_dataset(rows, max_dim=cfg.max_image_dim)

    # Import unsloth BEFORE trl/transformers/peft so its optimizations apply cleanly
    import unsloth  # noqa: F401
    from unsloth import FastVisionModel, is_bf16_supported
    from unsloth.trainer import UnslothVisionDataCollator
    from transformers import TrainerCallback
    from trl import SFTConfig, SFTTrainer

    print(f"Loading base model: {cfg.base_model_id} ...")
    model, tokenizer = FastVisionModel.from_pretrained(
        cfg.base_model_id,
        load_in_4bit=True,
        use_gradient_checkpointing="unsloth",
        token=token,
    )

    model = FastVisionModel.get_peft_model(
        model,
        finetune_vision_layers=True,
        finetune_language_layers=True,
        finetune_attention_modules=True,
        finetune_mlp_modules=True,
        r=cfg.lora_rank,
        lora_alpha=cfg.lora_alpha,
        lora_dropout=0,
        bias="none",
        random_state=cfg.seed,
        use_rslora=False,
    )

    FastVisionModel.for_training(model)

    assert api is not None

    class HubCheckpointCallback(TrainerCallback):
        """Auto-backup LoRA weights to Hugging Face Hub every save step (non-fatal on transient errors)."""

        def on_save(self, train_args, state, control, **kwargs):
            backup_dir = cfg.output_dir / "lora_backup"
            try:
                export_and_push_lora(
                    api,
                    model,
                    tokenizer,
                    cfg,
                    token,
                    backup_dir,
                    len(rows),
                    f"FoodCraft Llama-3.2-Vision LoRA (step {state.global_step})",
                )
            except Exception as exc:
                print(f"Note: non-fatal step {state.global_step} HF backup skipped ({exc})", flush=True)
            finally:
                shutil.rmtree(backup_dir, ignore_errors=True)
                gc.collect()

    ckpt_dir = cfg.output_dir / "checkpoints"
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        data_collator=UnslothVisionDataCollator(model, tokenizer),
        callbacks=[HubCheckpointCallback()],
        args=SFTConfig(
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=args.grad_accum,
            warmup_steps=cfg.warmup_steps,
            max_steps=args.max_steps if args.max_steps > 0 else -1,
            num_train_epochs=args.epochs,
            learning_rate=args.lr,
            fp16=not is_bf16_supported(),
            bf16=is_bf16_supported(),
            logging_steps=5,
            save_strategy="steps",
            save_steps=25,
            save_total_limit=1,
            dataloader_num_workers=0,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=cfg.seed,
            output_dir=str(ckpt_dir),
            report_to="none",
            remove_unused_columns=False,
            dataset_text_field="",
            dataset_kwargs={"skip_prepare_dataset": True},
            max_seq_length=cfg.max_seq_length,
        ),
    )

    resume_arg = args.resume_from_checkpoint
    if resume_arg == "auto":
        ckpts = sorted(ckpt_dir.glob("checkpoint-*"), key=lambda p: int(p.name.split("-")[-1]) if p.name.split("-")[-1].isdigit() else 0)
        resume_arg = str(ckpts[-1]) if ckpts else None
        if resume_arg:
            print(f"Auto-resuming training from {resume_arg} ...", flush=True)

    print("Starting Unsloth Llama-3.2-11B-Vision training ...", flush=True)
    trainer.train(resume_from_checkpoint=resume_arg)

    # 1. Save & push LoRA adapter first (small, fast, reliable backup)
    export_and_push_lora(
        api,
        model,
        tokenizer,
        cfg,
        token,
        cfg.output_dir / "lora_adapter",
        len(rows),
        "FoodCraft Llama-3.2-Vision LoRA",
    )

    # 2. Merge locally first, verify processor JSONs, then push shard-by-shard
    if args.push_merged and env_info["save_method"] != "lora_only":
        # Remove training checkpoints first so Kaggle / Colab has room for merged weights
        shutil.rmtree(ckpt_dir, ignore_errors=True)
        save_method = env_info["save_method"]
        merged_dir = cfg.output_dir / save_method
        merged_dir.mkdir(parents=True, exist_ok=True)
        print(f"Merging full model ({save_method}) into {merged_dir} ...", flush=True)
        model.save_pretrained_merged(
            str(merged_dir),
            tokenizer,
            save_method=save_method,
        )
        ensure_mllama_processor_files(merged_dir, cfg.base_unquantized_id, token)
        write_model_card(merged_dir, cfg, len(rows), is_lora=False)
        upload_folder_resilient(api, merged_dir, cfg.hub_model_repo, f"FoodCraft Llama-3.2-Vision ({save_method})")


if __name__ == "__main__":
    main()
