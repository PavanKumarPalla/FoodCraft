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

    # Run inference
    results = model.predict(
        source=np.array(image),
        conf=confidence_threshold,
        verbose=False,
    )

    BOX_COLORS = [
        "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4",
        "#ec4899", "#3b82f6", "#14b8a6", "#f97316", "#84cc16",
    ]

    detections = []
    seen_names = set()

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = model.names.get(cls_id, f"class_{cls_id}").strip().title()
            coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            x1, y1, x2, y2 = coords

            # Compute percentage coordinates relative to image dimensions
            x_pct = round((max(0.0, x1) / img_w) * 100, 2) if img_w > 0 else 0.0
            y_pct = round((max(0.0, y1) / img_h) * 100, 2) if img_h > 0 else 0.0
            w_pct = round((max(0.0, x2 - x1) / img_w) * 100, 2) if img_w > 0 else 0.0
            h_pct = round((max(0.0, y2 - y1) / img_h) * 100, 2) if img_h > 0 else 0.0

            color = BOX_COLORS[len(detections) % len(BOX_COLORS)]

            detections.append({
                "name": name,
                "confidence": f"{round(conf * 100, 1)}%",
                "confidence_raw": round(conf, 4),
                "color": color,
                "box": {
                    "x": x_pct,
                    "y": y_pct,
                    "w": w_pct,
                    "h": h_pct,
                },
                "bbox_pixels": [round(c, 1) for c in coords],
            })
            seen_names.add(name)

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
