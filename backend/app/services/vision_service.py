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

    # Run inference
    results = model.predict(
        source=np.array(image),
        conf=confidence_threshold,
        verbose=False,
    )

    detections = []
    seen_names = set()

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = model.names.get(cls_id, f"class_{cls_id}").lower().strip()
            coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]

            detections.append({
                "name": name,
                "confidence": round(conf, 4),
                "bbox": [round(c, 1) for c in coords],
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
