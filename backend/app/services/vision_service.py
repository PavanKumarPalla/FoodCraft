"""
Food Craft AI — Precision Multi-Engine Vision Service
──────────────────────────────────────────────────────
Three-stage detection pipeline:
  1. YOLOv8 Object Detection → bounding boxes with spatial coordinates
  2. CLIP Crop Verification  → re-identify every YOLO crop for label accuracy
  3. CLIP Grid Scan          → sliding-window discovery of items YOLO missed
  4. Smart NMS               → same-class dedup only (trust YOLO per-class NMS)

Zero image datasets on disk. All models are pre-trained.
"""

import base64
import io
import logging
import os
import warnings
from pathlib import Path
import numpy as np
from PIL import Image
import torch

warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

logger = logging.getLogger(__name__)

# ── Global Model Singletons ──────────────────────────────────
_yolo_model = None
_clip_model = None
_clip_preprocess = None
_clip_text_features = None
_clip_labels = None

# Comprehensive Zero-Shot Culinary Vocabulary
CULINARY_VOCABULARY = [
    # Produce & Vegetables
    "tomato", "cherry tomato", "potato", "sweet potato", "onion", "red onion",
    "spring onion", "garlic", "ginger", "carrot", "broccoli", "cauliflower",
    "cabbage", "spinach", "lettuce", "bell pepper", "capsicum", "chili pepper",
    "cucumber", "zucchini", "eggplant", "green beans", "peas", "corn",
    "mushroom", "radish", "beetroot", "pumpkin", "asparagus", "celery",
    "coriander", "mint", "curry leaves", "lemon", "lime", "artichoke",
    # Fruits
    "apple", "banana", "orange", "mandarin", "mango", "strawberry",
    "blueberry", "raspberry", "grape", "watermelon", "melon", "pineapple",
    "papaya", "avocado", "kiwi", "peach", "pear", "coconut", "fig",
    "cherry", "plum", "pomegranate",
    # Proteins, Dairy & Legumes
    "chicken", "chicken breast", "egg", "boiled egg", "paneer", "tofu",
    "cheese", "butter", "milk", "yogurt", "curd", "fish", "salmon", "shrimp",
    "mutton", "beef", "chickpeas", "lentils", "kidney beans", "almond",
    "cashew", "peanuts", "walnut",
    # Cooked Dishes & Composites
    "salad", "soup", "curry", "fried rice", "steamed rice", "biryani", "dal",
    "pasta", "noodles", "sandwich", "pizza", "burger", "dosa", "idli",
    "omelette", "bread", "toast", "rice",
]

# Canonical Name Normalizer — only exact key match or key-is-substring-of-input
CANONICAL_NAMES = {
    "bean curd/tofu": "Tofu", "bean curd": "Tofu", "tofu": "Tofu",
    "bell pepper/capsicum": "Bell Pepper", "capsicum": "Bell Pepper",
    "bell pepper": "Bell Pepper",
    "cantaloup/cantaloupe": "Cantaloupe", "cantaloupe": "Cantaloupe",
    "cantaloup": "Cantaloupe",
    "cayenne/cayenne spice/cayenne pepper/cayenne pepper spice/red pepper/red pepper": "Chili Pepper",
    "cayenne": "Chili Pepper", "red pepper": "Chili Pepper",
    "chickpea/garbanzo": "Chickpeas", "garbanzo": "Chickpeas",
    "chickpea": "Chickpeas", "chickpeas": "Chickpeas",
    "chili/chili vegetable/chili pepper/chili pepper vegetable/chilli/chilli vegetable/chilly/chilly": "Chili",
    "chili pepper": "Chili", "chili": "Chili", "chilli": "Chili",
    "coconut/cocoanut": "Coconut", "cocoanut": "Coconut",
    "date/date fruit": "Dates",
    "edible corn/corn/maize": "Corn", "corn": "Corn", "maize": "Corn",
    "cucumber/cuke": "Cucumber", "cuke": "Cucumber",
    "eggplant/aubergine": "Eggplant", "aubergine": "Eggplant",
    "fig/fig fruit": "Fig",
    "garlic/ail": "Garlic", "ail": "Garlic",
    "ginger/gingerroot": "Ginger", "gingerroot": "Ginger",
    "green onion/spring onion/scallion": "Spring Onion",
    "spring onion": "Spring Onion", "green onion": "Spring Onion",
    "scallion": "Spring Onion",
    "kiwi fruit": "Kiwi", "kiwi": "Kiwi",
    "mandarin orange": "Mandarin",
    "orange/orange fruit": "Orange",
    "pea/pea food": "Peas", "pea": "Peas",
    "green bean": "Green Beans", "green beans": "Green Beans",
    "radish/daikon": "Radish", "daikon": "Radish", "white radish": "Radish",
    "zucchini/courgette": "Zucchini", "courgette": "Zucchini",
    "sweet potato": "Sweet Potato",
    "cherry tomato": "Cherry Tomato",
    "cherries": "Cherry", "cherry": "Cherry",
    "strawberry": "Strawberry",
    "curd": "Yogurt",
    "paneer": "Paneer",
    "chicken breast": "Chicken",
    "boiled egg": "Egg",
    "steamed rice": "Rice", "white rice": "Rice", "fried rice": "Fried Rice",
    "red onion": "Onion",
    "tomato": "Tomato",
    "carrot": "Carrot",
    "onion": "Onion",
    "apple": "Apple",
    "broccoli": "Broccoli",
    "cauliflower": "Cauliflower",
    "cabbage": "Cabbage",
    "spinach": "Spinach",
    "lettuce": "Lettuce",
    "cucumber": "Cucumber",
    "mushroom": "Mushroom",
    "potato": "Potato",
    "banana": "Banana",
    "orange": "Orange",
    "mango": "Mango",
    "grape": "Grape",
    "pineapple": "Pineapple",
    "avocado": "Avocado",
    "lemon": "Lemon",
    "lime": "Lime",
    "peach": "Peach",
    "pear": "Pear",
    "fig": "Fig",
    "garlic": "Garlic",
    "ginger": "Ginger",
    "coconut": "Coconut",
    "artichoke": "Artichoke",
    "asparagus": "Asparagus",
    "celery": "Celery",
    "radish": "Radish",
    "beetroot": "Beetroot",
    "pumpkin": "Pumpkin",
    "eggplant": "Eggplant",
    "corn": "Corn",
    "peas": "Peas",
}

BOX_COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
    "#6366f1", "#16a34a"
]


def _clean_name(raw_name: str) -> str:
    """Normalize raw class names into clean culinary labels."""
    low = raw_name.lower().strip()

    # 1. Exact dictionary lookup
    if low in CANONICAL_NAMES:
        return CANONICAL_NAMES[low]

    # 2. Check if any canonical key is a substring of the input
    #    e.g., "bell pepper" in "bell pepper/capsicum"
    #    But NEVER reverse (prevents "tomato" matching "cherry tomato")
    for k, v in CANONICAL_NAMES.items():
        if k in low:
            return v

    # 3. Fallback: strip slash/paren suffixes and re-check
    cleaned = low.split("/")[0].split("(")[0].strip()
    if cleaned in CANONICAL_NAMES:
        return CANONICAL_NAMES[cleaned]
    return cleaned.title()


def _load_yolo_model():
    """Load the YOLOv8 food ingredients detection model."""
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    from ultralytics import YOLO
    from app.core.config import settings

    models_dir = Path(__file__).resolve().parent.parent.parent / "models"

    food_ingredients_path = models_dir / "yolov8_food_ingredients.pt"
    custom_path = Path(settings.YOLO_CUSTOM_WEIGHTS)
    foodseg_path = models_dir / "yolov8_foodseg103.pt"

    if food_ingredients_path.exists():
        chosen_weights = str(food_ingredients_path)
        logger.info("Using YOLOv8 Food Ingredients model: %s", chosen_weights)
    elif custom_path.exists():
        chosen_weights = str(custom_path)
        logger.info("Using custom YOLOv8 model: %s", chosen_weights)
    elif foodseg_path.exists():
        chosen_weights = str(foodseg_path)
        logger.info("Using FoodSeg103 YOLOv8 model: %s", chosen_weights)
    else:
        chosen_weights = settings.YOLO_FALLBACK_WEIGHTS
        logger.warning("Falling back to standard YOLO weights: %s", chosen_weights)

    _yolo_model = YOLO(chosen_weights)
    return _yolo_model


def _load_clip():
    """Lazy-load OpenAI CLIP ViT-B/32 and pre-encode culinary embeddings."""
    global _clip_model, _clip_preprocess, _clip_text_features, _clip_labels
    if _clip_model is not None and _clip_text_features is not None:
        return _clip_model, _clip_preprocess, _clip_text_features, _clip_labels

    try:
        import clip
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading CLIP ViT-B/32 on %s...", device)
        _clip_model, _clip_preprocess = clip.load("ViT-B/32", device=device)
        _clip_labels = CULINARY_VOCABULARY

        prompt_templates = [
            "a photo of fresh {}",
            "a close-up photo of {} on a table",
            "a clear photo of {} ingredient",
            "a photo of raw {}",
        ]

        text_embeddings = []
        with torch.no_grad():
            for item in _clip_labels:
                toks = clip.tokenize([t.format(item) for t in prompt_templates]).to(device)
                embs = _clip_model.encode_text(toks)
                embs = embs / embs.norm(dim=-1, keepdim=True)
                mean_emb = embs.mean(dim=0, keepdim=True)
                mean_emb = mean_emb / mean_emb.norm(dim=-1, keepdim=True)
                text_embeddings.append(mean_emb)
            _clip_text_features = torch.cat(text_embeddings, dim=0)

        logger.info("CLIP ready with %d zero-shot embeddings.", len(_clip_labels))
    except Exception as e:
        logger.warning("CLIP init failed: %s", e)
        _clip_model = None
        _clip_text_features = None

    return _clip_model, _clip_preprocess, _clip_text_features, _clip_labels


def _clip_identify_crop(crop: Image.Image, clip_m, clip_prep, text_features, labels,
                        device: str, top_k: int = 1, min_conf: float = 0.08):
    """Run CLIP on a cropped image region and return top-k (name, probability) pairs."""
    try:
        inp = clip_prep(crop).unsqueeze(0).to(device)
        with torch.no_grad():
            feat = clip_m.encode_image(inp)
            feat = feat / feat.norm(dim=-1, keepdim=True)
            sims = (100.0 * feat @ text_features.T).softmax(dim=-1)[0]
            probs = sims.cpu().numpy()

        top_indices = probs.argsort()[::-1][:top_k]
        results = []
        for idx in top_indices:
            p = float(probs[idx])
            if p >= min_conf:
                results.append((_clean_name(labels[idx]), p))
        return results
    except Exception:
        return []


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
    Three-stage food detection pipeline:
    1. YOLO → bounding boxes
    2. CLIP crop verification → correct each box's label
    3. CLIP grid scan → find items YOLO missed entirely
    4. Smart same-class NMS → remove duplicate boxes only
    """
    from app.core.config import settings

    if confidence_threshold is None or confidence_threshold < 0.15:
        confidence_threshold = 0.20

    image = _decode_image(image_base64)
    img_w, img_h = image.size

    # Upscale tiny images for better YOLO detection
    if img_w < 320 or img_h < 320:
        scale = max(1.0, 640.0 / max(img_w, img_h))
        infer_img = image.resize((int(img_w * scale), int(img_h * scale)), Image.Resampling.LANCZOS)
    else:
        infer_img = image

    yolo = _load_yolo_model()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load CLIP for crop verification and grid scan
    clip_m, clip_prep, text_features, labels = _load_clip()
    clip_available = clip_m is not None and text_features is not None

    raw_detections = []

    # ════════════════════════════════════════════════════════════
    # STAGE 1: YOLOv8 Detection → Raw Bounding Boxes
    # ════════════════════════════════════════════════════════════
    try:
        results = yolo.predict(
            source=np.array(infer_img),
            conf=confidence_threshold,
            iou=0.40,
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

                if raw_name in ("background", "other ingredients", "dishware", "plate", "person", "hand"):
                    continue

                yolo_name = _clean_name(raw_name)

                coords = box.xyxy[0].tolist()
                x1, y1, x2, y2 = coords

                # Rescale to original image coordinates
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

                # Reject tiny noise artifacts (< 2% of frame)
                if w_pct < 2.0 and h_pct < 2.0:
                    continue

                # ── STAGE 2: CLIP Crop Verification ──
                # Crop the YOLO box from the ORIGINAL image and ask CLIP what it really is
                final_name = yolo_name
                clip_conf = conf  # keep YOLO confidence if CLIP unavailable

                if clip_available:
                    # Pad crop by 10% for context
                    pad_x = real_w * 0.10
                    pad_y = real_h * 0.10
                    crop_x1 = max(0, int(real_x1 - pad_x))
                    crop_y1 = max(0, int(real_y1 - pad_y))
                    crop_x2 = min(img_w, int(real_x2 + pad_x))
                    crop_y2 = min(img_h, int(real_y2 + pad_y))

                    crop = image.crop((crop_x1, crop_y1, crop_x2, crop_y2))
                    if crop.size[0] > 10 and crop.size[1] > 10:
                        clip_results = _clip_identify_crop(
                            crop, clip_m, clip_prep, text_features, labels,
                            device, top_k=3, min_conf=0.05,
                        )
                        if clip_results:
                            clip_top_name, clip_top_prob = clip_results[0]
                            # Only override YOLO's label when YOLO is unsure
                            # (conf < 0.50) AND CLIP is reasonably confident
                            if conf < 0.50 and clip_top_prob >= 0.20:
                                final_name = clip_top_name

                raw_detections.append({
                    "name": final_name,
                    "confidence": f"{round(conf * 100, 1)}%",
                    "confidence_raw": round(conf, 4),
                    "box": {"x": x_pct, "y": y_pct, "w": w_pct, "h": h_pct},
                    "bbox_pixels": [round(real_x1, 1), round(real_y1, 1),
                                    round(real_x2, 1), round(real_y2, 1)],
                })
    except Exception as e:
        logger.error("YOLO inference error: %s", e)

    # ════════════════════════════════════════════════════════════
    # STAGE 3: CLIP Grid Scan — Find Items YOLO Missed
    # ════════════════════════════════════════════════════════════
    # Divide image into overlapping grid cells and run CLIP on each.
    # Only add items not already found by YOLO.
    if clip_available:
        try:
            yolo_names_found = set(d["name"] for d in raw_detections)
            grid_cols, grid_rows = 3, 3
            overlap = 0.15  # 15% overlap between cells
            cell_w = img_w / grid_cols
            cell_h = img_h / grid_rows
            pad_w = cell_w * overlap
            pad_h = cell_h * overlap

            grid_discoveries = []

            for row in range(grid_rows):
                for col in range(grid_cols):
                    gx1 = max(0, int(col * cell_w - pad_w))
                    gy1 = max(0, int(row * cell_h - pad_h))
                    gx2 = min(img_w, int((col + 1) * cell_w + pad_w))
                    gy2 = min(img_h, int((row + 1) * cell_h + pad_h))

                    cell_crop = image.crop((gx1, gy1, gx2, gy2))
                    if cell_crop.size[0] < 30 or cell_crop.size[1] < 30:
                        continue

                    cell_results = _clip_identify_crop(
                        cell_crop, clip_m, clip_prep, text_features, labels,
                        device, top_k=2, min_conf=0.20,
                    )

                    for cname, cprob in cell_results:
                        # Only add if YOLO didn't already find it AND it's
                        # not already discovered by another grid cell
                        all_found = yolo_names_found | set(g["name"] for g in grid_discoveries)
                        if cname not in all_found and cprob >= 0.20:
                            # Create a bounding box for this grid cell
                            gw = gx2 - gx1
                            gh = gy2 - gy1
                            grid_discoveries.append({
                                "name": cname,
                                "confidence": f"{round(cprob * 100, 1)}%",
                                "confidence_raw": round(cprob, 4),
                                "box": {
                                    "x": round((gx1 / img_w) * 100, 2),
                                    "y": round((gy1 / img_h) * 100, 2),
                                    "w": round((gw / img_w) * 100, 2),
                                    "h": round((gh / img_h) * 100, 2),
                                },
                                "bbox_pixels": [float(gx1), float(gy1),
                                                float(gx2), float(gy2)],
                            })

            raw_detections.extend(grid_discoveries)
            if grid_discoveries:
                logger.info("CLIP grid scan found %d additional items: %s",
                            len(grid_discoveries),
                            [g["name"] for g in grid_discoveries])
        except Exception as e:
            logger.warning("CLIP grid scan error: %s", e)

    # ════════════════════════════════════════════════════════════
    # STAGE 4: Same-Class NMS Only (No cross-class suppression)
    # ════════════════════════════════════════════════════════════
    # YOLO's built-in iou=0.40 already handles per-class NMS.
    # We only suppress true duplicates: same name + high overlap.
    raw_detections.sort(key=lambda d: d["confidence_raw"], reverse=True)
    detections = []
    seen_names = set()

    for cand in raw_detections:
        suppressed = False
        cx1, cy1, cx2, cy2 = cand["bbox_pixels"]
        c_area = max(0.0, cx2 - cx1) * max(0.0, cy2 - cy1)

        for sel in detections:
            sx1, sy1, sx2, sy2 = sel["bbox_pixels"]
            s_area = max(0.0, sx2 - sx1) * max(0.0, sy2 - sy1)

            ix1 = max(cx1, sx1)
            iy1 = max(cy1, sy1)
            ix2 = min(cx2, sx2)
            iy2 = min(cy2, sy2)
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)

            if inter > 0:
                union = c_area + s_area - inter
                iou = inter / union if union > 0 else 0.0
                min_area = min(c_area, s_area)
                iom = inter / min_area if min_area > 0 else 0.0

                # 1. Same class: suppress moderate overlap or containment
                if cand["name"] == sel["name"] and (iou > 0.35 or iom > 0.60):
                    suppressed = True
                    break

                # 2. Cross-class: suppress only near-identical boxes
                #    (e.g., same grid cell tagged as "Tomato" AND "Cherry Tomato")
                if iou > 0.85:
                    suppressed = True
                    break

        if not suppressed:
            detections.append(cand)
            seen_names.add(cand["name"])

    # ════════════════════════════════════════════════════════════
    # STAGE 5: Whole-Image CLIP for Scene-Level Tags
    # ════════════════════════════════════════════════════════════
    # If the image is a dish (salad, curry, biryani, etc.), add the dish name as a tag
    if clip_available:
        try:
            full_results = _clip_identify_crop(
                image, clip_m, clip_prep, text_features, labels,
                device, top_k=3, min_conf=0.15,
            )
            dish_keywords = {"Salad", "Soup", "Curry", "Fried Rice", "Biryani",
                             "Dal", "Pasta", "Noodles", "Pizza", "Sandwich",
                             "Burger", "Dosa", "Idli", "Omelette"}
            for cname, cprob in full_results:
                if cname in dish_keywords and cprob >= 0.20:
                    seen_names.add(cname)
                    break

            # Case: NO YOLO detections at all → use full-image CLIP
            if len(detections) == 0 and full_results:
                top_name, top_prob = full_results[0]
                seen_names.add(top_name)
                detections.append({
                    "name": top_name,
                    "confidence": f"{round(top_prob * 100, 1)}%",
                    "confidence_raw": round(top_prob, 4),
                    "box": {"x": 10.0, "y": 10.0, "w": 80.0, "h": 80.0},
                    "bbox_pixels": [
                        round(img_w * 0.10, 1), round(img_h * 0.10, 1),
                        round(img_w * 0.90, 1), round(img_h * 0.90, 1),
                    ],
                })
                if len(full_results) > 1 and full_results[1][1] >= 0.20:
                    seen_names.add(full_results[1][0])
        except Exception as e:
            logger.warning("CLIP scene recognition error: %s", e)

    # ── Assign Distinct Colors ────────────────────────────────
    for idx, d in enumerate(detections):
        d["color"] = BOX_COLORS[idx % len(BOX_COLORS)]

    unique_list = sorted(list(seen_names))

    logger.info(
        "Detection complete: %d boxes → %d unique ingredients: %s",
        len(detections), len(unique_list), unique_list,
    )

    return {
        "success": True,
        "detected_ingredients": detections,
        "unique_ingredients": unique_list,
        "count": len(unique_list),
        "model": "YOLOv8 + CLIP Zero-Shot Food Intelligence",
    }
