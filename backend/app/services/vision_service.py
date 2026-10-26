"""
Food Craft AI — Enhanced Dual-Engine Vision Service
────────────────────────────────────────────────────
Ensemble combining YOLOv8 (FoodSeg103 & custom food weights) for localized
object bounding boxes with OpenAI CLIP (ViT-B/32) for zero-shot culinary
scene verification. Accurately detects whole ingredients, chopped produce,
fridge containers, and cooked dishes (e.g. fried rice, noodles, curry, salad).
"""

import base64
import io
import logging
from pathlib import Path
import numpy as np
from PIL import Image
import torch

logger = logging.getLogger(__name__)

# ── Global Model Singletons ──────────────────────────────────
_yolo_model = None
_clip_model = None
_clip_preprocess = None
_clip_text_tokens = None
_clip_labels = None

# Comprehensive Food/Culinary Vocabulary for Zero-Shot Scene Classification
CULINARY_VOCABULARY = [
    # Cooked Dishes & Staples
    "fried rice", "white rice", "steamed rice", "rice", "pasta", "noodles", "bread",
    "pizza", "soup", "salad", "sandwich", "curry", "dosa", "idli", "biryani",
    # Produce & Vegetables
    "tomato", "cherry tomato", "potato", "sweet potato", "onion", "spring onion",
    "garlic", "ginger", "carrot", "corn", "green beans", "peas", "bell pepper",
    "capsicum", "chili pepper", "cucumber", "zucchini", "broccoli", "cauliflower",
    "spinach", "cabbage", "lettuce", "mushroom", "eggplant", "pumpkin", "avocado",
    "asparagus", "celery", "radish", "coriander", "mint", "lemon", "lime",
    # Fruits
    "orange", "mandarin", "apple", "banana", "strawberry", "blueberry", "raspberry",
    "cherry", "mango", "pineapple", "watermelon", "melon", "kiwi", "peach", "pear", "grape",
    # Proteins & Dairy
    "chicken", "egg", "paneer", "tofu", "cheese", "butter", "milk", "yogurt",
    "fish", "shrimp", "mutton", "beef", "pork", "almond", "cashew", "peanuts"
]

# Canonical Culinary Name Normalizer
CANONICAL_NAMES = {
    "chicken duck": "Chicken",
    "fried meat": "Meat",
    "cheese butter": "Cheese",
    "french fries": "French Fries",
    "green beans": "Green Beans",
    "french beans": "Green Beans",
    "snow peas": "Peas",
    "pea": "Peas",
    "pea food": "Peas",
    "cilantro mint": "Cilantro",
    "spring onion": "Spring Onion",
    "green onion": "Spring Onion",
    "scallion": "Spring Onion",
    "white radish": "Radish",
    "daikon": "Radish",
    "sweet potato": "Sweet Potato",
    "cherry tomato": "Cherry Tomato",
    "cherries": "Cherry",
    "bell pepper": "Capsicum",
    "capsicum": "Capsicum",
    "chili": "Chili",
    "chilli": "Chili",
    "cayenne": "Chili",
    "fried rice": "Fried Rice",
    "white rice": "Rice",
    "steamed rice": "Rice",
    "rice": "Rice",
    "tofu": "Tofu",
    "bean curd": "Tofu",
    "paneer": "Paneer",
    "corn cob": "Corn",
    "edible corn": "Corn",
    "maize": "Corn",
    "cuke": "Cucumber",
    "aubergine": "Eggplant",
    "cocoanut": "Coconut",
    "garbanzo": "Chickpeas",
    "chickpea": "Chickpeas",
    "gingerroot": "Ginger",
    "ail": "Garlic",
    "courgette": "Zucchini",
    "salad": "Salad",
}

BOX_COLORS = [
    "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4",
    "#ec4899", "#3b82f6", "#14b8a6", "#f97316", "#84cc16",
]


def _clean_name(raw_name: str) -> str:
    """Normalize raw class names from models into clean culinary ingredient labels."""
    low = raw_name.lower().strip()
    for k, v in CANONICAL_NAMES.items():
        if k in low:
            return v
    # Fallback cleanup
    cleaned = low.split("/")[0].split("(")[0].strip()
    if cleaned in CANONICAL_NAMES:
        return CANONICAL_NAMES[cleaned]
    return cleaned.title()


def _load_yolo_model():
    """Load the best available YOLOv8 food weights."""
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    from ultralytics import YOLO
    from app.core.config import settings

    models_dir = Path(__file__).resolve().parent.parent.parent / "models"
    foodseg_path = models_dir / "yolov8_foodseg103.pt"
    custom_path = Path(settings.YOLO_CUSTOM_WEIGHTS)

    chosen_weights = None
    if foodseg_path.exists():
        chosen_weights = str(foodseg_path)
        logger.info("Using FoodSeg103 YOLOv8 model: %s", chosen_weights)
    elif custom_path.exists():
        chosen_weights = str(custom_path)
        logger.info("Using custom YOLOv8 model: %s", chosen_weights)
    else:
        chosen_weights = settings.YOLO_FALLBACK_WEIGHTS
        logger.warning("Falling back to standard YOLO weights: %s", chosen_weights)

    _yolo_model = YOLO(chosen_weights)
    return _yolo_model


def _load_clip():
    """Lazy-load OpenAI CLIP model and pre-encode culinary text tokens."""
    global _clip_model, _clip_preprocess, _clip_text_tokens, _clip_labels
    if _clip_model is not None:
        return _clip_model, _clip_preprocess, _clip_text_tokens, _clip_labels

    try:
        import clip
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading CLIP ViT-B/32 on %s...", device)
        _clip_model, _clip_preprocess = clip.load("ViT-B/32", device=device)
        _clip_labels = CULINARY_VOCABULARY
        prompts = [f"a photo of delicious {item}" for item in _clip_labels]
        _clip_text_tokens = clip.tokenize(prompts).to(device)
        logger.info("CLIP loaded with %d culinary vocabulary items.", len(_clip_labels))
    except Exception as e:
        logger.warning("CLIP model could not be initialized: %s", e)
        _clip_model = None

    return _clip_model, _clip_preprocess, _clip_text_tokens, _clip_labels


def _decode_image(image_data: str) -> Image.Image:
    """Decode a base64-encoded image string into a PIL Image."""
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]
    raw_bytes = base64.b64decode(image_data)
    return Image.open(io.BytesIO(raw_bytes)).convert("RGB")


def detect_ingredients(
    image_base64: str,
    confidence_threshold: float | None = None,
) -> dict:
    """
    Dual-Engine Food Detection:
    1. Runs YOLOv8 for spatial bounding box localization of ingredients.
    2. Runs CLIP Zero-Shot Vision for scene-level and cooked-dish verification.
    3. Merges and deduplicates into high-confidence recognized food items.
    """
    from app.core.config import settings

    if confidence_threshold is None:
        confidence_threshold = settings.YOLO_CONFIDENCE_THRESHOLD or 0.15

    image = _decode_image(image_base64)
    img_w, img_h = image.size

    # Ensure appropriate resolution for feature extraction
    if img_w < 320 or img_h < 320:
        scale = max(1.0, 640.0 / max(img_w, img_h))
        scaled_w = int(img_w * scale)
        scaled_h = int(img_h * scale)
        infer_img = image.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    else:
        infer_img = image

    yolo = _load_yolo_model()
    raw_detections = []

    # ── 1. YOLOv8 Inference ──────────────────────────────────────
    try:
        results = yolo.predict(
            source=np.array(infer_img),
            conf=confidence_threshold,
            iou=0.45,
            imgsz=640,
            verbose=False,
        )

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                raw_name = yolo.names.get(cls_id, f"class_{cls_id}").strip().lower()

                # Ignore non-food background classes
                if raw_name in ("background", "other ingredients", "dishware", "plate"):
                    continue

                name = _clean_name(raw_name)

                coords = box.xyxy[0].tolist()
                x1, y1, x2, y2 = coords

                # Rescale coordinates to original image size
                orig_w, orig_h = infer_img.size
                scale_x = img_w / orig_w if orig_w > 0 else 1.0
                scale_y = img_h / orig_h if orig_h > 0 else 1.0

                real_x1 = max(0.0, x1 * scale_x)
                real_y1 = max(0.0, y1 * scale_y)
                real_x2 = min(float(img_w), x2 * scale_x)
                real_y2 = min(float(img_h), y2 * scale_y)
                real_w = max(1.0, real_x2 - real_x1)
                real_h = max(1.0, real_y2 - real_y1)

                x_pct = round((real_x1 / img_w) * 100, 2) if img_w > 0 else 0.0
                y_pct = round((real_y1 / img_h) * 100, 2) if img_h > 0 else 0.0
                w_pct = round((real_w / img_w) * 100, 2) if img_w > 0 else 0.0
                h_pct = round((real_h / img_h) * 100, 2) if img_h > 0 else 0.0

                raw_detections.append({
                    "name": name,
                    "confidence": f"{round(conf * 100, 1)}%",
                    "confidence_raw": round(conf, 4),
                    "box": {
                        "x": x_pct,
                        "y": y_pct,
                        "w": w_pct,
                        "h": h_pct,
                    },
                    "bbox_pixels": [round(real_x1, 1), round(real_y1, 1), round(real_x2, 1), round(real_y2, 1)],
                })
    except Exception as e:
        logger.error("YOLO inference error: %s", e)

    # ── 2. CLIP Zero-Shot Scene & Dish Verification ──────────────
    clip_scene_items = []
    try:
        clip_m, clip_prep, text_tokens, labels = _load_clip()
        if clip_m is not None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            clip_in = clip_prep(image).unsqueeze(0).to(device)
            with torch.no_grad():
                logits, _ = clip_m(clip_in, text_tokens)
                probs = logits.softmax(dim=-1).cpu().numpy()[0]

            top_idx = probs.argsort()[::-1]
            for idx in top_idx:
                prob = float(probs[idx])
                item_label = _clean_name(labels[idx])
                # High confidence items or top items
                if prob >= 0.12 or (len(clip_scene_items) < 3 and prob >= 0.05):
                    clip_scene_items.append((item_label, prob))
                if len(clip_scene_items) >= 4:
                    break
    except Exception as e:
        logger.warning("CLIP scene recognition skipped: %s", e)

    # ── 3. Spatial Non-Maximum Suppression on YOLO boxes ─────────
    raw_detections.sort(key=lambda d: d["confidence_raw"], reverse=True)
    detections = []
    seen_names = set()

    for cand in raw_detections:
        dominated = False
        for sel in detections:
            # Overlap check
            xA = max(cand["box"]["x"], sel["box"]["x"])
            yA = max(cand["box"]["y"], sel["box"]["y"])
            xB = min(cand["box"]["x"] + cand["box"]["w"], sel["box"]["x"] + sel["box"]["w"])
            yB = min(cand["box"]["y"] + cand["box"]["h"], sel["box"]["y"] + sel["box"]["h"])
            inter = max(0.0, xB - xA) * max(0.0, yB - yA)
            union = (cand["box"]["w"] * cand["box"]["h"]) + (sel["box"]["w"] * sel["box"]["h"]) - inter
            iou = inter / union if union > 0 else 0.0

            if cand["name"] == sel["name"] and iou > 0.35:
                dominated = True
                break
            if iou > 0.70:
                dominated = True
                break

        if not dominated:
            detections.append(cand)
            seen_names.add(cand["name"])

    # ── 4. Fuse CLIP scene detections (Dishes & Overall Ingredients) ──
    for clip_name, prob in clip_scene_items:
        # Check if already detected by YOLO
        already_present = any(
            d["name"].lower() in clip_name.lower() or clip_name.lower() in d["name"].lower()
            for d in detections
        )
        if not already_present and prob >= 0.08:
            seen_names.add(clip_name)
            # Add full-dish / prominent scene region
            detections.append({
                "name": clip_name,
                "confidence": f"{round(prob * 100, 1)}%",
                "confidence_raw": round(prob, 4),
                "box": {
                    "x": 8.0,
                    "y": 8.0,
                    "w": 84.0,
                    "h": 84.0,
                },
                "bbox_pixels": [
                    round(img_w * 0.08, 1),
                    round(img_h * 0.08, 1),
                    round(img_w * 0.92, 1),
                    round(img_h * 0.92, 1),
                ],
            })

    # Assign distinct colors to boxes
    for idx, d in enumerate(detections):
        d["color"] = BOX_COLORS[idx % len(BOX_COLORS)]

    unique_list = sorted(list(seen_names))

    logger.info(
        "Dual-Engine detected %d boxes → %d unique ingredients: %s",
        len(detections),
        len(unique_list),
        unique_list,
    )

    return {
        "success": True,
        "detected_ingredients": detections,
        "unique_ingredients": unique_list,
        "count": len(unique_list),
        "model": "YOLOv8 + CLIP Food Intelligence",
    }
