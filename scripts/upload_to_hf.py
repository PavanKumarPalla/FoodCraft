import os
import sys
import time
from huggingface_hub import HfApi

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

TOKEN = os.environ.get("HF_TOKEN")
if not TOKEN:
    print("Error: HF_TOKEN environment variable is required to authenticate with Hugging Face.")
    print("Usage: Set HF_TOKEN=your_token_here in your environment or .env file before running.")
    sys.exit(1)

REPO_ID = os.environ.get("HF_DATASET_REPO", "FoodCraft/foodcraft-recipes")
LOCAL_FILE = os.path.join("data", "Cleaned_dataset.csv")

if not os.path.exists(LOCAL_FILE):
    print(f"Error: {LOCAL_FILE} not found!")
    sys.exit(1)

file_size_gb = os.path.getsize(LOCAL_FILE) / (1024 * 1024 * 1024)
print(f"Dataset Repository: https://huggingface.co/datasets/{REPO_ID}")
print(f"Target File: {LOCAL_FILE} ({file_size_gb:.2f} GB)")
print("Starting high-speed upload to Hugging Face Hub via Git LFS...")

api = HfApi(token=TOKEN)

start_time = time.time()

api.upload_file(
    path_or_fileobj=LOCAL_FILE,
    path_in_repo="Cleaned_dataset.csv",
    repo_id=REPO_ID,
    repo_type="dataset",
    commit_message="Upload full original Cleaned_dataset.csv (2.2M recipes)"
)

elapsed_sec = time.time() - start_time
print("===================================================")
print("SUCCESS: Full original dataset uploaded to Hugging Face!")
print(f"Total time elapsed: {elapsed_sec/60:.2f} minutes")
print(f"Live URL: https://huggingface.co/datasets/{REPO_ID}")
print("===================================================")
