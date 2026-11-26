"""
Food Craft Fine-Tune Workspace — Safe Unsloth & Dependency Installer
────────────────────────────────────────────────────────────────────
Installs Unsloth + Llama-3.2-Vision dependencies in the verified non-conflicting
order to avoid the most common Colab/Kaggle/Linux pip resolution errors
(transformers/trl/xformers/bitsandbytes/unsloth_zoo mismatches).
"""

from __future__ import annotations

import importlib
import importlib.util
import platform
import subprocess
import sys


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


def verify_imports() -> list[str]:
    required = [
        "torch",
        "transformers",
        "trl",
        "peft",
        "accelerate",
        "bitsandbytes",
        "huggingface_hub",
        "PIL",
        "pyarrow",
    ]
    missing: list[str] = []
    print("\n--- Verifying Installed Packages ---", flush=True)
    for mod_name in required:
        try:
            mod = importlib.import_module(mod_name)
            ver = getattr(mod, "__version__", "ok")
            print(f"  {mod_name:18s}: {ver}")
        except ImportError:
            missing.append(mod_name)
            print(f"  {mod_name:18s}: MISSING")

    try:
        import unsloth  # noqa: F401

        print(f"  {'unsloth':18s}: {getattr(unsloth, '__version__', 'installed')}")
    except Exception as exc:
        print(f"  {'unsloth':18s}: NOT READY ({exc})")

    return missing


def main() -> None:
    env = check_environment()
    print("=" * 64)
    print("Food Craft Llama-3.2-Vision Environment Setup")
    print(f"Python: {env['python']} | OS: {env['platform']} | CUDA: {env['cuda_available']}")
    if env["cuda_available"]:
        print(f"GPU: {env['gpu_name']} ({env['vram_gb']} GB VRAM)")
        if env["vram_gb"] < 14.0:
            print("WARNING: Llama-3.2-11B-Vision 4-bit LoRA needs >=14-15 GB VRAM (T4/L4/A100).")
    else:
        print("NOTE: No CUDA GPU detected locally — GPU packages require a CUDA machine (Colab/Kaggle/RunPod).")
    print("=" * 64)

    if "--check-only" in sys.argv:
        missing = verify_imports()
        if missing:
            print(f"\nMissing packages ({len(missing)}): {', '.join(missing)}")
        return

    run_pip(["install", "--upgrade", "pip"])

    # Step 1: Core Hugging Face & serialization libs first
    run_pip([
        "install",
        "--upgrade",
        "huggingface_hub>=0.34.0",
        "transformers>=4.49.0,<4.52.0",
        "datasets>=3.2.0",
        "pyarrow>=15.0.0",
        "pillow>=10.0.0",
        "requests>=2.31.0",
        "safetensors>=0.4.5",
        "sentencepiece>=0.2.0",
        "protobuf>=4.25.0",
        "python-dotenv>=1.0.0",
        "fastapi>=0.115.0",
        "uvicorn>=0.34.0",
    ])

    if not env["cuda_available"]:
        print("\nSkipping CUDA-only Unsloth/bitsandbytes/xformers install on CPU-only host.")
        verify_imports()
        return

    # Step 2: Install Unsloth & PEFT stack with --no-deps to prevent transformers/trl downgrade loops
    in_colab = "google.colab" in sys.modules or bool(importlib.util.find_spec("google.colab"))
    if in_colab:
        run_pip(["install", "--no-deps", "bitsandbytes", "accelerate", "xformers==0.0.29.post3", "peft", "trl==0.15.2", "triton", "cut_cross_entropy", "unsloth_zoo"], allow_fail=True)
        run_pip(["install", "--no-deps", "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"])
    else:
        run_pip(["install", "--no-deps", "bitsandbytes", "accelerate", "peft", "trl==0.15.2", "cut_cross_entropy", "unsloth_zoo"], allow_fail=True)
        run_pip(["install", "--no-deps", "unsloth"])

    # Re-pin transformers/huggingface_hub cleanly if anything drifted
    run_pip(["install", "--no-deps", "--upgrade", "unsloth", "unsloth_zoo"], allow_fail=True)
    verify_imports()
    print("\nDependency setup completed without conflicts!")


if __name__ == "__main__":
    main()
