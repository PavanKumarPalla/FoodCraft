# Food Craft Fine-Tune Workspace (`Llama-3.2-11B-Vision-Instruct` + Unsloth)

This workspace downloads Food Craft's datasets using `HF_TOKEN`, formats multimodal conversational data grounded in `pavankumarpalla/FoodCraft`, fine-tunes `unsloth/Llama-3.2-11B-Vision-Instruct-bnb-4bit`, pushes the LoRA + merged 16-bit model cleanly to Hugging Face Hub, and integrates the deployed model back into Food Craft.

## Prerequisites (Verify Before Running)

1. **`HF_TOKEN` with Write Permission:**
   - Must have **Write** access under your Hugging Face namespace (`pavankumarpalla`) so `create_repo` and `upload_file` succeed without `403 Forbidden`.
   - Store it in `.env`, `backend/.env`, `export HF_TOKEN=hf_...`, or Colab Secrets (`HF_TOKEN`).
2. **NVIDIA CUDA GPU (≥15 GB VRAM):**
   - Required for Unsloth 4-bit Vision training (Google Colab T4/L4/A100, Kaggle T4, RunPod, Lambda, or GPU server).
   - Merging & pushing full 16-bit weights (`~20 GB`) requires ~45 GB free disk space and ≥24 GB system RAM.

## Step-by-Step Workflow

```bash
# 1. Install conflict-free dependencies (pinning transformers/trl/unsloth order)
python finetune_workspace/install_deps.py

# 2. Fetch datasets with HF_TOKEN (or format already-downloaded D:\Food Craft\data)
python finetune_workspace/prepare_dataset.py --max-per-source 15000

# 3. Pre-flight check + train Llama-3.2-11B-Vision + safely push to Hugging Face
python finetune_workspace/train_and_push.py --max-steps 800 --push-merged

# 4. (Optional) Serve the pushed Hugging Face model for Food Craft
python finetune_workspace/inference_server.py --port 8001
```

Or open `FoodCraft_Llama32_Vision_Unsloth.ipynb` directly on Google Colab / Kaggle GPU.
