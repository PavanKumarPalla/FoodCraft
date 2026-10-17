"""
Food Craft AI — Vision Service (YOLOv8 Ingredient Detection)
─────────────────────────────────────────────────────────────
Wraps Ultralytics YOLOv8 for real-time food ingredient detection
from camera snapshots or uploaded images.

Flow:
    1. Load custom food-domain weights from backend/models/
    2. If custom weights are missing, fall back to pretrained yolov8n.pt
    3. Accept a base64-encoded image or raw bytes
    4. Run inference and return detected ingredient labels + confidence
"""

import base64
import io
import logging
from pathlib import Path

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ── Lazy-loaded model singleton ──────────────────────────────
_model = None


def _load_model():
    """Load the YOLOv8 model once and cache it globally."""
    global _model
    if _model is not None:
        return _model

    from ultralytics import YOLO
    from app.core.config import settings

    custom = Path(settings.YOLO_CUSTOM_WEIGHTS)
    if not custom.exists():
        logger.info("Custom food weights not found at %s. Downloading from Hugging Face Hub...", custom)
        try:
            from huggingface_hub import hf_hub_download
            import shutil
            custom.parent.mkdir(parents=True, exist_ok=True)
            dl_path = hf_hub_download(
                repo_id="Senu-12/snapstock-fruit-vegetable-detector",
                filename="yolov8/fruit_vegetable_yolov8m.pt",
                local_dir=str(custom.parent),
            )
            dl = Path(dl_path)
            if dl.exists() and dl != custom:
                shutil.copy2(dl, custom)
                logger.info("Cached food weights to: %s", custom)
        except Exception as e:
            logger.warning("Could not auto-download food weights from Hugging Face: %s", e)

    if custom.exists():
        logger.info("Loading custom YOLOv8 food weights: %s", custom.name)
        _model = YOLO(str(custom))
    else:
        logger.warning(
            "Custom weights not found at %s — falling back to %s",
            custom,
            settings.YOLO_FALLBACK_WEIGHTS,
        )
        _model = YOLO(settings.YOLO_FALLBACK_WEIGHTS)

    logger.info("YOLOv8 model loaded. Classes: %s", len(_model.names))
    return _model


def _decode_image(image_data: str) -> Image.Image:
    """Decode a base64-encoded image string into a PIL Image."""
    # Strip optional data-URI prefix (e.g. "data:image/jpeg;base64,...")
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    raw_bytes = base64.b64decode(image_data)
    return Image.open(io.BytesIO(raw_bytes)).convert("RGB")


def detect_ingredients(
    image_base64: str,
    confidence_threshold: float | None = None,
) -> dict:
    """
    Run YOLOv8 inference on a base64-encoded image.

    Returns:
        {
            "success": True,
            "detected_ingredients": [
                {"name": "tomato", "confidence": 0.92, "bbox": [x1,y1,x2,y2]},
                ...
            ],
            "unique_ingredients": ["tomato", "onion", ...],
            "count": 5,
            "model": "yolov8n_food_ingredients.pt"
        }
    """
    from app.core.config import settings

    if confidence_threshold is None:
        confidence_threshold = settings.YOLO_CONFIDENCE_THRESHOLD

    model = _load_model()
    image = _decode_image(image_base64)
    img_w, img_h = image.size

    # If image is unusually small, upscale with high-quality resampling for YOLO feature extraction
    if img_w < 320 or img_h < 320:
        scale = max(1.0, 640.0 / max(img_w, img_h))
        scaled_w = int(img_w * scale)
        scaled_h = int(img_h * scale)
        infer_img = image.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    else:
        infer_img = image

    # Run inference with standardized 640 input resolution and NMS
    results = model.predict(
        source=np.array(infer_img),
        conf=confidence_threshold,
        iou=0.45,
        imgsz=640,
        verbose=False,
    )

    BOX_COLORS = [
        "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4",
        "#ec4899", "#3b82f6", "#14b8a6", "#f97316", "#84cc16",
    ]

    raw_detections = []

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            raw_name = model.names.get(cls_id, f"class_{cls_id}").strip().lower()

            # Clean compound label names from LVIS / Food weights into clear culinary names
            if "kiwi" in raw_name:
                name = "Kiwi"
            elif "tomato" in raw_name:
                name = "Tomato"
            elif "potato" in raw_name and "sweet" not in raw_name:
                name = "Potato"
            elif "sweet potato" in raw_name:
                name = "Sweet Potato"
            elif "onion" in raw_name and "green" not in raw_name and "spring" not in raw_name:
                name = "Onion"
            elif "spring onion" in raw_name or "green onion" in raw_name or "scallion" in raw_name:
                name = "Spring Onion"
            elif "garlic" in raw_name:
                name = "Garlic"
            elif "ginger" in raw_name:
                name = "Ginger"
            elif "corn" in raw_name or "maize" in raw_name:
                name = "Corn"
            elif "cucumber" in raw_name or "cuke" in raw_name:
                name = "Cucumber"
            elif "capsicum" in raw_name or "bell pepper" in raw_name:
                name = "Capsicum"
            elif "chili" in raw_name or "chilli" in raw_name or "cayenne" in raw_name:
                name = "Chili"
            elif "mushroom" in raw_name:
                name = "Mushroom"
            elif "tofu" in raw_name or "bean curd" in raw_name:
                name = "Tofu"
            elif "lemon" in raw_name:
                name = "Lemon"
            elif "lime" in raw_name:
                name = "Lime"
            elif "apple" in raw_name:
                name = "Apple"
            elif "banana" in raw_name:
                name = "Banana"
            elif "orange" in raw_name:
                name = "Orange"
            elif "strawberry" in raw_name:
                name = "Strawberry"
            elif "blueberry" in raw_name:
                name = "Blueberry"
            elif "blackberry" in raw_name:
                name = "Blackberry"
            elif "eggplant" in raw_name or "aubergine" in raw_name:
                name = "Eggplant"
            elif "watermelon" in raw_name:
                name = "Watermelon"
            elif "broccoli" in raw_name:
                name = "Broccoli"
            elif "carrot" in raw_name:
                name = "Carrot"
            elif "cauliflower" in raw_name:
                name = "Cauliflower"
            elif "avocado" in raw_name:
                name = "Avocado"
            elif "spinach" in raw_name or "lettuce" in raw_name:
                name = "Spinach"
            elif "almond" in raw_name:
                name = "Almond"
            elif "asparagus" in raw_name:
                name = "Asparagus"
            elif "celery" in raw_name:
                name = "Celery"
            elif "cherry" in raw_name:
                name = "Cherry"
            elif "coconut" in raw_name:
                name = "Coconut"
            elif "grape" in raw_name:
                name = "Grape"
            elif "green bean" in raw_name:
                name = "Green Bean"
            elif "pea" in raw_name:
                name = "Peas"
            elif "peach" in raw_name:
                name = "Peach"
            elif "pear" in raw_name:
                name = "Pear"
            elif "pineapple" in raw_name:
                name = "Pineapple"
            elif "pumpkin" in raw_name:
                name = "Pumpkin"
            elif "radish" in raw_name:
                name = "Radish"
            elif "zucchini" in raw_name:
                name = "Zucchini"
            else:
                name = raw_name.split("/")[0].strip().title()

            coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            x1, y1, x2, y2 = coords

            # Map coordinates back to original image dimensions if infer_img was scaled
            orig_infer_w = infer_img.size[0]
            orig_infer_h = infer_img.size[1]
            scale_x = img_w / orig_infer_w if orig_infer_w > 0 else 1.0
            scale_y = img_h / orig_infer_h if orig_infer_h > 0 else 1.0

            real_x1 = max(0.0, x1 * scale_x)
            real_y1 = max(0.0, y1 * scale_y)
            real_x2 = min(float(img_w), x2 * scale_x)
            real_y2 = min(float(img_h), y2 * scale_y)
            real_w = max(1.0, real_x2 - real_x1)
            real_h = max(1.0, real_y2 - real_y1)

            # Compute percentage coordinates relative to original image dimensions
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

    # Sort by raw confidence descending and apply secondary deduplication
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
            color = BOX_COLORS[len(detections) % len(BOX_COLORS)]
            cand["color"] = color
            detections.append(cand)
            seen_names.add(cand["name"])

    unique_list = sorted(seen_names)

    logger.info(
        "Detected %d objects → %d unique ingredients: %s",
        len(detections),
        len(unique_list),
        unique_list,
    )

    return {
        "success": True,
        "detected_ingredients": detections,
        "unique_ingredients": unique_list,
        "count": len(unique_list),
        "model": Path(settings.YOLO_CUSTOM_WEIGHTS).name
        if Path(settings.YOLO_CUSTOM_WEIGHTS).exists()
        else settings.YOLO_FALLBACK_WEIGHTS,
    }
