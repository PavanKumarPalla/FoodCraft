"""
Food Craft Fine-Tune Workspace — Safe Unsloth & Dependency Installer
────────────────────────────────────────────────────────────────────
Installs Unsloth + Llama-3.2-Vision dependencies cleanly on Kaggle, Colab,
or Linux GPU servers (Python 3.11–3.13, CUDA 12.x/13.0) without forcing
incompatible xformers source builds that break bitsandbytes/trl installation.
"""

from __future__ import annotations

import importlib
import importlib.util
import os
import platform
import subprocess
import sys
from pathlib import Path


def run_pip(args: list[str], allow_fail: bool = False) -> bool:
    cmd = [sys.executable, "-m", "pip", *args]
    print(f"\n>>> {' '.join(cmd)}", flush=True)
    proc = subprocess.run(cmd)
    if proc.returncode != 0:
        if allow_fail:
            print(f"WARNING: Optional command failed cleanly: {' '.join(cmd)}", flush=True)
            return False
        raise SystemExit(proc.returncode)
    return True


def check_environment() -> dict:
    info = {
        "python": sys.version.split()[0],
        "platform": platform.system(),
        "is_kaggle": bool(os.environ.get("KAGGLE_KERNEL_RUN_TYPE") or Path("/kaggle/working").exists()),
        "cuda_available": False,
        "gpu_name": None,
        "vram_gb": 0.0,
    }
    try:
        import torch

        info["torch"] = torch.__version__
        info["cuda_available"] = bool(torch.cuda.is_available())
        if info["cuda_available"]:
            info["gpu_name"] = torch.cuda.get_device_name(0)
            props = torch.cuda.get_device_properties(0)
            info["vram_gb"] = round(props.total_memory / (1024 ** 3), 2)
    except Exception as exc:
        info["torch_error"] = str(exc)
    return info


def verify_imports(check_unsloth: bool = True) -> list[str]:
    missing: list[str] = []
    print("\n--- Verifying Installed Packages ---", flush=True)

    # Import unsloth BEFORE transformers/peft so its patches apply cleanly
    if check_unsloth:
        try:
            import unsloth  # noqa: F401
            from unsloth import FastVisionModel  # noqa: F401

            print(f"  {'unsloth':18s}: {getattr(unsloth, '__version__', 'installed')}")
        except Exception as exc:
            missing.append("unsloth")
            print(f"  {'unsloth':18s}: NOT READY ({exc})")

    required = [
        "torch",
        "transformers",
        "trl",
        "peft",
        "accelerate",
        "bitsandbytes",
        "huggingface_hub",
        "datasets",
        "PIL",
        "pyarrow",
    ]
    for mod_name in required:
        try:
            mod = importlib.import_module(mod_name)
            ver = getattr(mod, "__version__", "ok")
            print(f"  {mod_name:18s}: {ver}")
        except ImportError:
            missing.append(mod_name)
            print(f"  {mod_name:18s}: MISSING")

    return missing


def main() -> None:
    env = check_environment()
    print("=" * 64)
    print("Food Craft Llama-3.2-Vision Environment Setup")
    print(
        f"Python: {env['python']} | OS: {env['platform']} | "
        f"Kaggle: {env['is_kaggle']} | CUDA: {env['cuda_available']}"
    )
    if env["cuda_available"]:
        print(f"GPU: {env['gpu_name']} ({env['vram_gb']} GB VRAM)")
        if env["vram_gb"] < 14.0:
            print("WARNING: Llama-3.2-11B-Vision 4-bit LoRA needs >=14-15 GB VRAM (T4/L4/A100).")
    else:
        print("NOTE: No CUDA GPU detected locally — GPU packages require a CUDA machine (Kaggle/Colab/RunPod).")
    print("=" * 64)

    if "--check-only" in sys.argv:
        missing = verify_imports(check_unsloth=env["cuda_available"])
        if missing:
            print(f"\nMissing packages ({len(missing)}): {', '.join(missing)}")
        return

    run_pip(["install", "--upgrade", "pip"])

    # Helper libs needed across dataset prep & API server
    run_pip([
        "install",
        "--upgrade",
        "python-dotenv>=1.0.0",
        "fastapi>=0.115.0",
        "uvicorn>=0.34.0",
        "hf_transfer",
        "tyro",
        "msgspec",
    ])

    if not env["cuda_available"]:
        run_pip(["install", "--upgrade", "huggingface_hub>=0.34.0", "pyarrow>=15.0.0", "pillow>=10.0.0", "requests>=2.31.0"])
        print("\nSkipping CUDA-only Unsloth/bitsandbytes/trl install on CPU-only host.")
        verify_imports(check_unsloth=False)
        return

    run_pip(["install", "unsloth", "unsloth_zoo"])
    run_pip(["install", "--upgrade", "--no-deps", "accelerate", "peft", "bitsandbytes"])
    run_pip(["install", "datasets>=3.4.1,<5.0.0", "transformers==4.56.2"])
    run_pip(["install", "--no-deps", "trl==0.22.2"])
    run_pip(["cache", "purge"], allow_fail=True)

    missing = verify_imports(check_unsloth=True)
    if missing:
        raise RuntimeError(f"Dependency verification failed; missing: {', '.join(missing)}")
    print("\nDependency setup completed cleanly!")


if __name__ == "__main__":
    main()
