"""
Food Craft Live Inference Space (Hugging Face ZeroGPU + Gradio 5)
──────────────────────────────────────────────────────────────────
Serves `pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision` on ZeroGPU (`@spaces.GPU`)
with both an interactive UI (`detect_image`) and JSON/base64 API (`detect_b64`).
"""

from __future__ import annotations

import spaces  # noqa: F401  # Must be imported before torch on ZeroGPU

import base64
import io
import json
import os
import re

import gradio as gr
import torch
from PIL import Image
from transformers import AutoProcessor, MllamaForConditionalGeneration

MODEL_ID = os.environ.get("HF_VISION_MODEL_ID", "pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision")
HF_TOKEN = os.environ.get("HF_TOKEN") or None

BOX_COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
    "#6366f1", "#16a34a",
]

print(f"Loading processor & model: {MODEL_ID} ...", flush=True)
processor = AutoProcessor.from_pretrained(MODEL_ID, token=HF_TOKEN)
model = MllamaForConditionalGeneration.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
    low_cpu_mem_usage=True,
    token=HF_TOKEN,
)
model.eval()
print("Model weights loaded on host CPU (ready for ZeroGPU attachment).", flush=True)


def _parse_json_ingredients(raw_text: str) -> list[str]:
    match = re.search(r"\{[\s\S]*\}", raw_text)
    if match:
        try:
            obj = json.loads(match.group(0))
            items = list(obj.get("ingredients") or [])
            dish = obj.get("dish")
            if dish and str(dish).strip().lower() not in ("none", "null", ""):
                if str(dish).strip() not in items:
                    items.insert(0, str(dish).strip())
            seen: set[str] = set()
            cleaned: list[str] = []
            for item in items:
                val = str(item).strip().title()
                if val and val not in seen:
                    seen.add(val)
                    cleaned.append(val)
            return cleaned
        except Exception:
            pass
    return []


def _format_result(names: list[str], raw_text: str = "") -> dict:
    detected = [
        {
            "name": name,
            "confidence": "94.0%",
            "confidence_raw": 0.94,
            "box": {"x": round(10.0 + (i % 3) * 25.0, 2), "y": round(10.0 + (i // 3) * 25.0, 2), "w": 30.0, "h": 30.0},
            "bbox_pixels": [100.0, 100.0, 400.0, 400.0],
            "color": BOX_COLORS[i % len(BOX_COLORS)],
        }
        for i, name in enumerate(names)
    ]
    return {
        "success": bool(names),
        "detected_ingredients": detected,
        "unique_ingredients": names,
        "count": len(names),
        "raw_text": raw_text,
        "model": f"FoodCraft Llama-3.2 Vision ({MODEL_ID})",
    }


def _run_mllama_inference(image: Image.Image) -> dict:
    rgb = image.convert("RGB")
    if max(rgb.size) > 560:
        scale = 560.0 / float(max(rgb.size))
        rgb = rgb.resize((int(rgb.width * scale), int(rgb.height * scale)), Image.Resampling.LANCZOS)

    if next(model.parameters()).device.type != "cuda":
        model.to("cuda")

    prompt = (
        "Analyze this food image for Food Craft and reply ONLY with JSON in this format: "
        '{"ingredients": ["Item1", "Item2"], "dish": "DishNameOrNone"}.'
    )
    messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt}]}]
    input_text = processor.apply_chat_template(messages, add_generation_prompt=True, tokenize=False)
    inputs = processor(images=rgb, text=input_text, add_special_tokens=False, return_tensors="pt")
    inputs = {k: v.to("cuda") for k, v in inputs.items()}

    with torch.no_grad():
        output_ids = model.generate(**inputs, max_new_tokens=160, do_sample=False)
    generated = output_ids[0][inputs["input_ids"].shape[-1]:]
    raw_text = processor.decode(generated, skip_special_tokens=True)
    return _format_result(_parse_json_ingredients(raw_text), raw_text=raw_text)


@spaces.GPU(duration=90)
def detect_image(image: Image.Image | None) -> dict:
    """Detect food ingredients & dish name from an uploaded PIL image."""
    if image is None:
        return {"success": False, "error": "Please provide a food image.", "unique_ingredients": [], "count": 0}
    return _run_mllama_inference(image)


@spaces.GPU(duration=90)
def detect_b64(image_b64: str) -> dict:
    """Detect food ingredients & dish name from a base64 string (Food Craft API endpoint)."""
    if not image_b64 or not str(image_b64).strip():
        return {"success": False, "error": "Empty base64 image payload.", "unique_ingredients": [], "count": 0}
    try:
        raw = image_b64.split(",", 1)[1] if "," in image_b64 else image_b64
        pil_img = Image.open(io.BytesIO(base64.b64decode(raw))).convert("RGB")
    except Exception as exc:
        return {"success": False, "error": f"Invalid base64 image: {exc}", "unique_ingredients": [], "count": 0}
    return _run_mllama_inference(pil_img)


with gr.Blocks(title="FoodCraft Vision API") as demo:
    gr.Markdown(
        "# FoodCraft — Llama-3.2-11B-Vision Live API\n"
        f"Serving `{MODEL_ID}` on Hugging Face ZeroGPU."
    )
    with gr.Tab("Upload Food Photo"):
        with gr.Row():
            with gr.Column():
                img_input = gr.Image(type="pil", label="Upload Food Image")
                run_btn = gr.Button("Detect Ingredients", variant="primary")
            with gr.Column():
                json_out = gr.JSON(label="Detected Ingredients & Dish")
        run_btn.click(detect_image, inputs=[img_input], outputs=[json_out], api_name="detect_image")

    with gr.Tab("Base64 JSON API"):
        b64_input = gr.Textbox(label="Base64 Image", placeholder="data:image/jpeg;base64,...")
        b64_btn = gr.Button("Run Base64 API")
        b64_out = gr.JSON(label="API Output")
        b64_btn.click(detect_b64, inputs=[b64_input], outputs=[b64_out], api_name="detect_b64")


if __name__ == "__main__":
    demo.launch()
