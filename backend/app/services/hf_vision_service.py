"""
Food Craft AI — Fine-Tuned Hugging Face Vision Service
──────────────────────────────────────────────────────
Connects Food Craft's FastAPI backend to the fine-tuned Hugging Face model
(`pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision` or LoRA adapter):
  1. Hosted HF Inference Endpoint / Space / Colab GPU (`HF_VISION_INFERENCE_URL`)
  2. Local CUDA GPU execution via Transformers / PEFT (when CUDA GPU is present)
  3. Hugging Face Inference Router (`router.huggingface.co/v1/chat/completions`)
     when `HF_VISION_USE_ROUTER=True`
"""

from __future__ import annotations

import base64
import io
import json
import logging
import re

import requests
import torch
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

_HF_MODEL = None
_HF_PROCESSOR = None

BOX_COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
    "#6366f1", "#16a34a",
]


def _parse_json_ingredients(raw_text: str) -> list[str]:
    """Extract clean ingredient/dish labels from the VLM JSON output."""
    match = re.search(r"\{[\s\S]*\}", raw_text)
    if match:
        try:
            obj = json.loads(match.group(0))
            items = list(obj.get("ingredients") or [])
            dish = obj.get("dish")
            if dish and str(dish).strip().lower() not in ("none", "null", ""):
                if str(dish).strip() not in items:
                    items.insert(0, str(dish).strip())
            seen = set()
            cleaned = []
            for item in items:
                val = str(item).strip().title()
                if val and val not in seen:
                    seen.add(val)
                    cleaned.append(val)
            return cleaned
        except Exception:
            pass
    return []


def _format_detection_response(names: list[str], model_label: str) -> dict:
    detected = [
        {
            "name": name,
            "confidence": "94.0%",
            "confidence_raw": 0.94,
            "box": {
                "x": round(10.0 + (i % 3) * 25.0, 2),
                "y": round(10.0 + (i // 3) * 25.0, 2),
                "w": 30.0,
                "h": 30.0,
            },
            "bbox_pixels": [100.0, 100.0, 400.0, 400.0],
            "color": BOX_COLORS[i % len(BOX_COLORS)],
        }
        for i, name in enumerate(names)
    ]
    return {
        "success": True,
        "detected_ingredients": detected,
        "unique_ingredients": names,
        "count": len(names),
        "model": model_label,
    }


def _call_gradio_space(base_url: str, image_base64: str, headers: dict) -> dict | None:
    """Invoke a Hugging Face Gradio 5 ZeroGPU Space via /gradio_api/call/detect_b64."""
    try:
        submit = requests.post(
            f"{base_url}/gradio_api/call/detect_b64",
            headers=headers,
            json={"data": [image_base64]},
            timeout=30,
        )
        if not submit.ok:
            return None
        event_id = submit.json().get("event_id")
        if not event_id:
            return None

        stream = requests.get(
            f"{base_url}/gradio_api/call/detect_b64/{event_id}",
            headers=headers,
            stream=True,
            timeout=90,
        )
        if not stream.ok:
            return None

        current_event = None
        try:
            for line in stream.iter_lines(decode_unicode=True):
                if not line:
                    continue
                if line.startswith("event:"):
                    current_event = line.split(":", 1)[1].strip()
                    if current_event == "error":
                        break
                elif line.startswith("data:") and current_event == "complete":
                    parsed_list = json.loads(line[5:].strip())
                    if isinstance(parsed_list, list) and parsed_list and isinstance(parsed_list[0], dict):
                        result = parsed_list[0]
                        if result.get("success") and (result.get("is_food") is False or result.get("unique_ingredients")):
                            return result
                    break
        finally:
            stream.close()
    except Exception as exc:
        logger.warning("Gradio Space vision error: %s", exc)
    return None


def _call_remote_endpoint(image_base64: str) -> dict | None:
    """Call hosted inference_server.py URL, Gradio HF Space, or HF Inference Router."""
    headers = {"Content-Type": "application/json"}
    if settings.HF_TOKEN:
        headers["Authorization"] = f"Bearer {settings.HF_TOKEN}"

    if settings.HF_VISION_INFERENCE_URL:
        base_url = settings.HF_VISION_INFERENCE_URL.rstrip("/")
        if ".hf.space" in base_url:
            gradio_res = _call_gradio_space(base_url, image_base64, headers)
            if gradio_res:
                return gradio_res
        else:
            try:
                resp = requests.post(
                    f"{base_url}/api/detect-ingredients",
                    headers=headers,
                    json={"image": image_base64},
                    timeout=60,
                )
                if resp.ok:
                    data = resp.json()
                    if data.get("success") and (data.get("is_food") is False or data.get("unique_ingredients")):
                        return data
            except Exception as exc:
                logger.warning("HF_VISION_INFERENCE_URL error: %s", exc)

    if settings.HF_VISION_USE_ROUTER and settings.HF_TOKEN and settings.HF_VISION_MODEL_ID:
        img_uri = image_base64 if image_base64.startswith("data:") else f"data:image/jpeg;base64,{image_base64}"
        prompt = (
            "Analyze this food image for Food Craft and reply ONLY with JSON in this format: "
            '{"ingredients": ["Item1", "Item2"], "dish": "DishNameOrNone"}.'
        )
        try:
            resp = requests.post(
                "https://router.huggingface.co/v1/chat/completions",
                headers=headers,
                json={
                    "model": settings.HF_VISION_MODEL_ID,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": img_uri}},
                            ],
                        }
                    ],
                    "max_tokens": 180,
                },
                timeout=60,
            )
            if resp.ok:
                content = resp.json()["choices"][0]["message"]["content"]
                names = _parse_json_ingredients(content)
                if names:
                    return _format_detection_response(
                        names, f"FoodCraft Llama-3.2 Vision ({settings.HF_VISION_MODEL_ID})"
                    )
        except Exception as exc:
            logger.warning("HF Router vision notice: %s", exc)

    return None


def _run_local_cuda_model(image_base64: str) -> dict | None:
    """Load the fine-tuned Hugging Face model locally when CUDA GPU is available."""
    global _HF_MODEL, _HF_PROCESSOR
    if not settings.HF_USE_VISION_LLM or not torch.cuda.is_available():
        return None

    try:
        if _HF_MODEL is None:
            from transformers import AutoProcessor, MllamaForConditionalGeneration

            dtype = (
                torch.bfloat16
                if getattr(torch.cuda, "is_bf16_supported", lambda: False)()
                else torch.float16
            )
            tok = settings.HF_TOKEN or None
            try:
                _HF_PROCESSOR = AutoProcessor.from_pretrained(settings.HF_VISION_MODEL_ID, token=tok)
                _HF_MODEL = MllamaForConditionalGeneration.from_pretrained(
                    settings.HF_VISION_MODEL_ID,
                    torch_dtype=dtype,
                    device_map="auto",
                    token=tok,
                )
            except Exception:
                from peft import PeftModel

                _HF_PROCESSOR = AutoProcessor.from_pretrained(settings.HF_VISION_LORA_ID, token=tok)
                base = MllamaForConditionalGeneration.from_pretrained(
                    "unsloth/Llama-3.2-11B-Vision-Instruct",
                    torch_dtype=dtype,
                    device_map="auto",
                    token=tok,
                )
                _HF_MODEL = PeftModel.from_pretrained(base, settings.HF_VISION_LORA_ID, token=tok)
            _HF_MODEL.eval()

        raw = image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
        image = Image.open(io.BytesIO(base64.b64decode(raw))).convert("RGB")
        prompt = (
            "Analyze this food image for Food Craft and reply ONLY with JSON in this format: "
            '{"ingredients": ["Item1", "Item2"], "dish": "DishNameOrNone"}.'
        )
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt}]}]
        input_text = _HF_PROCESSOR.apply_chat_template(messages, add_generation_prompt=True, tokenize=False)
        inputs = _HF_PROCESSOR(image, input_text, add_special_tokens=False, return_tensors="pt").to(_HF_MODEL.device)
        with torch.no_grad():
            out_ids = _HF_MODEL.generate(**inputs, max_new_tokens=160, do_sample=False)
        generated = out_ids[0][inputs["input_ids"].shape[-1]:]
        names = _parse_json_ingredients(_HF_PROCESSOR.decode(generated, skip_special_tokens=True))
        if names:
            return _format_detection_response(names, f"FoodCraft Llama-3.2 Vision ({settings.HF_VISION_MODEL_ID})")
    except Exception as exc:
        logger.warning("Local HF Llama-3.2-Vision inference fallback: %s", exc)
    return None


def detect_with_hf_vision(image_base64: str) -> dict | None:
    """Attempt fine-tuned Hugging Face Llama-3.2-Vision inference (remote or local GPU)."""
    remote = _call_remote_endpoint(image_base64)
    if remote:
        return remote
    return _run_local_cuda_model(image_base64)
