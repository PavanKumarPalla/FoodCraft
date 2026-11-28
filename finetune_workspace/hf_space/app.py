"""
Food Craft Live Inference Space (Hugging Face ZeroGPU + Gradio 5)
──────────────────────────────────────────────────────────────────
1. CLIP Food Gate (`openai/clip-vit-base-patch32`):
   Rejects unrelated non-food images (people, basketballs, cars, screenshots, etc.)
   with a clear food-specific message instead of hallucinating ingredients.
2. FoodCraft VLM (`pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision`):
   Identifies food dishes & ingredients accurately.
3. Open-Vocabulary Box Grounding (`IDEA-Research/grounding-dino-tiny`):
   Localizes accurate bounding boxes `[x, y, w, h]` directly over each visible food item.
"""

from __future__ import annotations

import spaces  # noqa: F401  # Must be imported before torch on ZeroGPU

import base64
import inspect
import io
import json
import os
import re

import gradio as gr
import torch
from PIL import Image
from transformers import (
    AutoModelForZeroShotObjectDetection,
    AutoProcessor,
    CLIPModel,
    CLIPProcessor,
    MllamaForConditionalGeneration,
)

MODEL_ID = os.environ.get("HF_VISION_MODEL_ID", "pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision")
CLIP_ID = "openai/clip-vit-base-patch32"
DINO_ID = "IDEA-Research/grounding-dino-tiny"
HF_TOKEN = os.environ.get("HF_TOKEN") or None

BOX_COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
    "#6366f1", "#16a34a",
]

FOOD_CLIP_PROMPTS = [
    "a photo of food, a cooked meal, dish, biryani, curry, soup, pizza, pasta, or salad",
    "fresh vegetables, fruits, groceries, pantry ingredients, spices, meat, or eggs",
    "raw or chopped cooking ingredients on a cutting board, plate, bowl, basket, or table",
    "bread, dessert, cake, beverage, drink, coffee, tea, juice, or snacks",
]

NON_FOOD_CLIP_PROMPTS = [
    ("a portrait of a person, man, woman, child, athlete, or group of people", "a person"),
    ("sports activity or equipment such as a basketball, football, soccer ball, bat, or gym", "sports equipment (such as a basketball)"),
    ("a car, motorcycle, bicycle, train, airplane, or vehicle", "a vehicle"),
    ("an animal or pet such as a dog, cat, bird, or wildlife", "an animal"),
    ("a smartphone, laptop, computer screen, electronics, or gadget", "electronics / a screen"),
    ("a text document, book page, chart, webpage screenshot, or meme", "a document / screenshot"),
    ("nature scenery, building, room furniture, clothing, shoes, or non-food object", "a non-food scene"),
]

# Non-visual / ambient culinary items we keep in ingredients list without drawing fake boxes
NON_BOX_INGREDIENTS = {
    "salt", "sugar", "water", "cooking oil", "oil", "olive oil", "vegetable oil",
    "spice", "spices", "seasoning", "pepper powder", "chili powder", "masala",
}

NON_FOOD_NOUNS = {
    "person", "man", "woman", "boy", "girl", "human", "athlete", "player", "face", "hand",
    "basketball", "football", "soccer ball", "baseball", "tennis ball", "ball", "jersey",
    "shirt", "t-shirt", "clothes", "shoe", "sneaker", "car", "bike", "motorcycle", "truck",
    "phone", "smartphone", "laptop", "computer", "monitor", "screen", "keyboard", "mouse",
    "chair", "table", "sofa", "bed", "building", "house", "tree", "flower", "dog", "cat",
    "bird", "book", "paper", "document", "clock", "watch", "glasses", "sunglasses",
}

print(f"Loading VLM + CLIP guard + GroundingDINO grounder ({MODEL_ID}) ...", flush=True)
processor = AutoProcessor.from_pretrained(MODEL_ID, token=HF_TOKEN)
model = MllamaForConditionalGeneration.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
    low_cpu_mem_usage=True,
    token=HF_TOKEN,
)
model.eval()

clip_processor = CLIPProcessor.from_pretrained(CLIP_ID)
clip_model = CLIPModel.from_pretrained(CLIP_ID, torch_dtype=torch.float32)
clip_model.eval()

dino_processor = AutoProcessor.from_pretrained(DINO_ID)
dino_model = AutoModelForZeroShotObjectDetection.from_pretrained(DINO_ID, torch_dtype=torch.float32)
dino_model.eval()
print("All models ready on host CPU for ZeroGPU.", flush=True)


def _ensure_cuda() -> None:
    if next(model.parameters()).device.type != "cuda":
        model.to("cuda")
    if next(clip_model.parameters()).device.type != "cuda":
        clip_model.to("cuda")
    if next(dino_model.parameters()).device.type != "cuda":
        dino_model.to("cuda")


def _check_is_food(rgb: Image.Image) -> tuple[bool, str]:
    """Use CLIP zero-shot classification to reject unrelated non-food images early."""
    all_prompts = FOOD_CLIP_PROMPTS + [p[0] for p in NON_FOOD_CLIP_PROMPTS]
    inputs = clip_processor(text=all_prompts, images=rgb, return_tensors="pt", padding=True)
    inputs = {k: v.to("cuda") if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}

    with torch.no_grad():
        logits = clip_model(**inputs).logits_per_image[0]
        probs = logits.softmax(dim=0).detach().cpu().tolist()

    n_food = len(FOOD_CLIP_PROMPTS)
    food_probs = probs[:n_food]
    non_food_probs = probs[n_food:]

    total_food = sum(food_probs)
    max_food = max(food_probs)

    ranked_non = sorted(
        zip([p[1] for p in NON_FOOD_CLIP_PROMPTS], non_food_probs),
        key=lambda x: x[1],
        reverse=True,
    )
    top_non_label, top_non_prob = ranked_non[0]

    # Mention secondary strong visual cue if both e.g. person + basketball are clearly present
    subjects = [top_non_label]
    if len(ranked_non) > 1 and ranked_non[1][1] >= 0.16 and ranked_non[1][0] != top_non_label:
        subjects.append(ranked_non[1][0])
    subject_desc = " and ".join(subjects)

    # Clear non-food rejection threshold while allowing photos of someone holding food
    if total_food < 0.30 or (total_food < 0.44 and top_non_prob > max_food and top_non_prob > 0.30):
        return False, subject_desc
    return True, ""


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


def _box_metrics(a: dict, b: dict) -> tuple[float, float]:
    ax1, ay1, ax2, ay2 = a["x"], a["y"], a["x"] + a["w"], a["y"] + a["h"]
    bx1, by1, bx2, by2 = b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    if inter <= 0.0:
        return 0.0, 0.0
    area_a = a["w"] * a["h"]
    area_b = b["w"] * b["h"]
    union = area_a + area_b - inter
    min_area = min(area_a, area_b)
    iou = inter / union if union > 0.0 else 0.0
    ioa = inter / min_area if min_area > 0.0 else 0.0
    return iou, ioa


def _clip_refine_labels(orig_rgb: Image.Image, candidates: list[dict], choices: list[str]) -> None:
    """Disambiguate visually similar round items (e.g. Apple vs Onion) using CLIP on each crop."""
    if len(choices) < 2 or not candidates:
        return
    ow, oh = orig_rgb.size
    prompts = [f"a close-up photo of fresh {c.lower()}" for c in choices]
    crops: list[Image.Image] = []
    valid_indices: list[int] = []
    for idx, item in enumerate(candidates):
        x1, y1, x2, y2 = item["bbox_pixels"]
        pad_x = (x2 - x1) * 0.08
        pad_y = (y2 - y1) * 0.08
        cx1 = max(0, int(x1 - pad_x))
        cy1 = max(0, int(y1 - pad_y))
        cx2 = min(ow, int(x2 + pad_x))
        cy2 = min(oh, int(y2 + pad_y))
        if cx2 - cx1 >= 16 and cy2 - cy1 >= 16:
            crops.append(orig_rgb.crop((cx1, cy1, cx2, cy2)))
            valid_indices.append(idx)

    if not crops:
        return

    inputs = clip_processor(text=prompts, images=crops, return_tensors="pt", padding=True)
    inputs = {k: v.to("cuda") if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}
    with torch.no_grad():
        probs = clip_model(**inputs).logits_per_image.softmax(dim=1).detach().cpu().tolist()

    for idx, row_probs in zip(valid_indices, probs):
        best_i = max(range(len(choices)), key=lambda i: row_probs[i])
        best_choice = choices[best_i]
        best_p = row_probs[best_i]
        cur_name = candidates[idx]["name"]
        cur_p = row_probs[choices.index(cur_name)] if cur_name in choices else 0.0
        if best_choice != cur_name and best_p >= 0.42 and best_p > cur_p + 0.12:
            candidates[idx]["name"] = best_choice


def _match_canonical_label(raw_label: str, candidates: list[str]) -> str:
    clean = re.sub(r"[^a-z0-9\s]", " ", raw_label.lower()).strip()
    if not clean:
        return candidates[0]
    best = None
    best_overlap = 0
    clean_words = set(clean.split())
    for cand in candidates:
        c_low = cand.lower()
        if c_low == clean:
            return cand
        overlap = len(clean_words & set(re.sub(r"[^a-z0-9\s]", " ", c_low).split()))
        if overlap > best_overlap:
            best_overlap = overlap
            best = cand
        elif c_low in clean or clean in c_low:
            best = cand
            best_overlap = max(best_overlap, 1)
    return best or clean.title()


def _ground_boxes(rgb: Image.Image, names: list[str]) -> list[dict]:
    """Use Grounding DINO + CLIP crop refinement to place tight boxes on visible food items."""
    box_targets = [n for n in names if n.lower() not in NON_BOX_INGREDIENTS]
    if not box_targets:
        box_targets = list(names)
    if not box_targets:
        return []

    orig_w, orig_h = rgb.size
    sig = inspect.signature(dino_processor.post_process_grounded_object_detection).parameters

    def _run_dino(query_items: list[str], thresh: float) -> list[dict]:
        text_prompt = ". ".join(q.lower() for q in query_items) + "."
        d_inputs = dino_processor(images=rgb, text=text_prompt, return_tensors="pt")
        d_inputs = {k: v.to("cuda") if isinstance(v, torch.Tensor) else v for k, v in d_inputs.items()}
        with torch.no_grad():
            d_outputs = dino_model(**d_inputs)

        pp_kwargs = {
            "outputs": d_outputs,
            "input_ids": d_inputs["input_ids"],
            "text_threshold": max(0.16, thresh - 0.04),
            "target_sizes": [(orig_h, orig_w)],
        }
        if "threshold" in sig:
            pp_kwargs["threshold"] = thresh
        else:
            pp_kwargs["box_threshold"] = thresh

        res = dino_processor.post_process_grounded_object_detection(**pp_kwargs)[0]
        raw_labels = res.get("text_labels") or res.get("labels") or []
        parsed: list[dict] = []
        for box_t, score_t, lbl in zip(res["boxes"], res["scores"], raw_labels):
            x1, y1, x2, y2 = [float(v) for v in box_t.tolist()]
            conf = float(score_t.item())
            px = round(max(0.0, min(98.0, (x1 / orig_w) * 100.0)), 2)
            py = round(max(0.0, min(98.0, (y1 / orig_h) * 100.0)), 2)
            pw = round(max(0.0, min(100.0 - px, ((x2 - x1) / orig_w) * 100.0)), 2)
            ph = round(max(0.0, min(100.0 - py, ((y2 - y1) / orig_h) * 100.0)), 2)
            if pw < 3.0 or ph < 3.0:
                continue
            canonical = _match_canonical_label(str(lbl), query_items)
            parsed.append({
                "name": canonical,
                "confidence": f"{round(conf * 100.0, 1)}%",
                "confidence_raw": round(conf, 4),
                "box": {"x": px, "y": py, "w": pw, "h": ph},
                "bbox_pixels": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
            })
        return parsed

    candidates = _run_dino(box_targets, thresh=0.28)
    if not candidates and box_targets:
        candidates = _run_dino([box_targets[0], "food plate", "bowl of food"], thresh=0.17)
        for item in candidates:
            if item["name"].lower() in {"food plate", "bowl of food"}:
                item["name"] = box_targets[0]

    candidates.sort(key=lambda d: d["confidence_raw"], reverse=True)
    # Single primary dish: keep strongest dish box(es) instead of weak background clutter
    if len(box_targets) == 1 and candidates:
        top_score = candidates[0]["confidence_raw"]
        candidates = [c for c in candidates if c["confidence_raw"] >= max(0.50, top_score - 0.15)][:2]

    _clip_refine_labels(rgb, candidates[:20], box_targets)

    selected: list[dict] = []
    per_class_counts: dict[str, int] = {}
    for cand in candidates:
        suppressed = False
        for sel in selected:
            iou, ioa = _box_metrics(cand["box"], sel["box"])
            if (cand["name"] == sel["name"] and (iou > 0.35 or ioa > 0.65)) or iou > 0.45 or ioa > 0.78:
                suppressed = True
                break
        if not suppressed and per_class_counts.get(cand["name"], 0) < 3:
            selected.append(cand)
            per_class_counts[cand["name"]] = per_class_counts.get(cand["name"], 0) + 1
        if len(selected) >= 12:
            break

    for i, item in enumerate(selected):
        item["color"] = BOX_COLORS[i % len(BOX_COLORS)]
    return selected


def _run_mllama_inference(image: Image.Image) -> dict:
    orig_rgb = image.convert("RGB")
    _ensure_cuda()

    # Stage 1: Non-food gate
    is_food, subject_desc = _check_is_food(orig_rgb)
    if not is_food:
        msg = "No food items detected. Please upload a photo of food, dishes, or cooking ingredients."
        return {
            "success": True,
            "is_food": False,
            "detected_subject": subject_desc,
            "detected_ingredients": [],
            "unique_ingredients": [],
            "count": 0,
            "model": "FoodCraft Llama-3.2 Vision + CLIP Guard",
            "message": msg,
        }

    # Resize a copy for single-tile 560px VLM inference while keeping orig_rgb for sharp box grounding
    vlm_rgb = orig_rgb
    if max(vlm_rgb.size) > 560:
        scale = 560.0 / float(max(vlm_rgb.size))
        vlm_rgb = vlm_rgb.resize((int(vlm_rgb.width * scale), int(vlm_rgb.height * scale)), Image.Resampling.LANCZOS)

    prompt = (
        "Analyze this food image for Food Craft and reply ONLY with JSON in this format: "
        '{"ingredients": ["Item1", "Item2"], "dish": "DishNameOrNone"}.'
    )
    messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt}]}]
    input_text = processor.apply_chat_template(messages, add_generation_prompt=True, tokenize=False)
    inputs = processor(images=vlm_rgb, text=input_text, add_special_tokens=False, return_tensors="pt")
    inputs = {k: v.to("cuda") for k, v in inputs.items()}

    with torch.no_grad():
        output_ids = model.generate(**inputs, max_new_tokens=120, do_sample=False)
    generated = output_ids[0][inputs["input_ids"].shape[-1]:]
    raw_text = processor.decode(generated, skip_special_tokens=True)

    names = _parse_json_ingredients(raw_text)
    food_names = [n for n in names if n.lower() not in NON_FOOD_NOUNS]
    if names and not food_names:
        non_food_desc = ", ".join(names[:3])
        return {
            "success": True,
            "is_food": False,
            "detected_subject": non_food_desc,
            "detected_ingredients": [],
            "unique_ingredients": [],
            "count": 0,
            "raw_text": raw_text,
            "model": f"FoodCraft Llama-3.2 Vision ({MODEL_ID})",
            "message": "No food items detected. Please upload a photo of food, dishes, or cooking ingredients.",
        }

    detected_boxes = _ground_boxes(orig_rgb, food_names) if food_names else []
    # Merge any visible grounded labels we matched back into unique_ingredients cleanly (preserve order)
    unique_list = list(food_names)
    for b in detected_boxes:
        if b["name"] not in unique_list:
            unique_list.append(b["name"])

    return {
        "success": True,
        "is_food": bool(unique_list),
        "detected_ingredients": detected_boxes,
        "unique_ingredients": unique_list,
        "count": len(unique_list),
        "raw_text": raw_text,
        "model": f"FoodCraft Llama-3.2 Vision ({MODEL_ID})",
        "message": (
            None
            if unique_list
            else "No clear food ingredients recognized in this photo. Please try a clearer food photo."
        ),
    }


@spaces.GPU(duration=45)
def detect_image(image: Image.Image | None) -> dict:
    """Detect food ingredients & dish name from an uploaded PIL image."""
    if image is None:
        return {"success": False, "error": "Please provide a food image.", "unique_ingredients": [], "count": 0}
    return _run_mllama_inference(image)


@spaces.GPU(duration=45)
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
        f"Serving `{MODEL_ID}` on Hugging Face ZeroGPU with CLIP non-food guard & Grounding DINO bounding boxes."
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
