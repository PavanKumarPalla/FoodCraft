#!/usr/bin/env python3
"""
Lightweight YOLOv8 ONNX Detector — Runs on Render without PyTorch
─────────────────────────────────────────────────────────────────
Uses only: onnxruntime, numpy, Pillow (< 50MB total dependencies)
No PyTorch, No ultralytics, No CUDA required.

Usage:
    python backend/scripts/onnx_detect.py <image_path_or_base64_file> [confidence]
"""

import sys
import os
import json
import base64
import io
from pathlib import Path
import numpy as np
from PIL import Image

# ── Model Configuration ──────────────────────────────────────
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
ONNX_MODEL = MODEL_DIR / "yolov8_food_ingredients_q8.onnx"
ONNX_MODEL_FULL = MODEL_DIR / "yolov8_food_ingredients.onnx"

# 63 food ingredient classes from the YOLOv8 food model
CLASS_NAMES = {
    0: "almond", 1: "apple", 2: "apricot", 3: "artichoke", 4: "asparagus",
    5: "avocado", 6: "banana", 7: "bean curd/tofu", 8: "bell pepper/capsicum",
    9: "blackberry", 10: "blueberry", 11: "broccoli", 12: "brussels sprouts",
    13: "cantaloup/cantaloupe", 14: "carrot", 15: "cauliflower",
    16: "cayenne/cayenne spice/cayenne pepper/cayenne pepper spice/red pepper/red pepper",
    17: "celery", 18: "cherry", 19: "chickpea/garbanzo",
    20: "chili/chili vegetable/chili pepper/chili pepper vegetable/chilli/chilli vegetable/chilly/chilly",
    21: "clementine", 22: "coconut/cocoanut", 23: "edible corn/corn/maize",
    24: "cucumber/cuke", 25: "date/date fruit", 26: "eggplant/aubergine",
    27: "fig/fig fruit", 28: "garlic/ail", 29: "ginger/gingerroot",
    30: "Strawberry", 31: "gourd", 32: "grape",
    33: "green bean", 34: "green onion/spring onion/scallion", 35: "Tomato",
    36: "kiwi fruit", 37: "lemon", 38: "lettuce", 39: "lime",
    40: "mandarin orange", 41: "melon", 42: "mushroom", 43: "onion",
    44: "orange/orange fruit", 45: "papaya", 46: "pea/pea food",
    47: "peach", 48: "pear", 49: "persimmon", 50: "pickle",
    51: "pineapple", 52: "potato", 53: "prune", 54: "pumpkin",
    55: "radish/daikon", 56: "raspberry", 57: "strawberry",
    58: "sweet potato", 59: "tomato", 60: "turnip", 61: "watermelon",
    62: "zucchini/courgette"
}

# Canonical name mapping
CANONICAL = {
    "bean curd/tofu": "Tofu", "bean curd": "Tofu", "tofu": "Tofu",
    "bell pepper/capsicum": "Bell Pepper", "capsicum": "Bell Pepper", "bell pepper": "Bell Pepper",
    "cantaloup/cantaloupe": "Cantaloupe", "cantaloupe": "Cantaloupe",
    "cayenne": "Chili Pepper", "red pepper": "Chili Pepper",
    "chickpea/garbanzo": "Chickpeas", "garbanzo": "Chickpeas", "chickpea": "Chickpeas",
    "chili pepper": "Chili", "chili": "Chili", "chilli": "Chili",
    "coconut/cocoanut": "Coconut", "cocoanut": "Coconut",
    "edible corn/corn/maize": "Corn", "corn": "Corn", "maize": "Corn",
    "cucumber/cuke": "Cucumber", "cuke": "Cucumber",
    "eggplant/aubergine": "Eggplant", "aubergine": "Eggplant",
    "garlic/ail": "Garlic", "ail": "Garlic",
    "ginger/gingerroot": "Ginger", "gingerroot": "Ginger",
    "green onion/spring onion/scallion": "Spring Onion", "spring onion": "Spring Onion",
    "green onion": "Spring Onion", "scallion": "Spring Onion",
    "kiwi fruit": "Kiwi", "mandarin orange": "Mandarin",
    "orange/orange fruit": "Orange", "pea/pea food": "Peas",
    "green bean": "Green Beans", "radish/daikon": "Radish", "daikon": "Radish",
    "zucchini/courgette": "Zucchini", "courgette": "Zucchini",
    "sweet potato": "Sweet Potato", "cherry tomato": "Cherry Tomato",
    "date/date fruit": "Dates", "fig/fig fruit": "Fig",
    "tomato": "Tomato", "carrot": "Carrot", "onion": "Onion",
    "apple": "Apple", "broccoli": "Broccoli", "cauliflower": "Cauliflower",
    "lettuce": "Lettuce", "cucumber": "Cucumber", "mushroom": "Mushroom",
    "potato": "Potato", "banana": "Banana", "orange": "Orange",
    "grape": "Grape", "pineapple": "Pineapple", "avocado": "Avocado",
    "lemon": "Lemon", "lime": "Lime", "peach": "Peach", "pear": "Pear",
    "fig": "Fig", "garlic": "Garlic", "ginger": "Ginger", "coconut": "Coconut",
    "artichoke": "Artichoke", "asparagus": "Asparagus", "celery": "Celery",
    "radish": "Radish", "pumpkin": "Pumpkin", "eggplant": "Eggplant",
    "strawberry": "Strawberry", "cherry": "Cherry", "raspberry": "Raspberry",
    "blueberry": "Blueberry", "blackberry": "Blackberry",
    "watermelon": "Watermelon", "melon": "Melon", "papaya": "Papaya",
    "persimmon": "Persimmon", "almond": "Almond", "clementine": "Clementine",
    "gourd": "Gourd", "pickle": "Pickle", "prune": "Prune", "turnip": "Turnip",
    "pea": "Peas", "mango": "Mango",
}

BOX_COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
    "#6366f1", "#16a34a"
]


def clean_name(raw):
    low = raw.lower().strip()
    if low in CANONICAL:
        return CANONICAL[low]
    for k, v in CANONICAL.items():
        if k in low:
            return v
    cleaned = low.split("/")[0].split("(")[0].strip()
    if cleaned in CANONICAL:
        return CANONICAL[cleaned]
    return cleaned.title()


def preprocess(image, imgsz=320):
    """Resize + pad image to imgsz x imgsz, return float32 NCHW tensor and scale info."""
    orig_w, orig_h = image.size
    scale = min(imgsz / orig_w, imgsz / orig_h)
    new_w, new_h = int(orig_w * scale), int(orig_h * scale)

    resized = image.resize((new_w, new_h), Image.Resampling.BILINEAR)

    # Pad to square
    padded = Image.new("RGB", (imgsz, imgsz), (114, 114, 114))
    pad_x, pad_y = (imgsz - new_w) // 2, (imgsz - new_h) // 2
    padded.paste(resized, (pad_x, pad_y))

    # Convert to NCHW float32 [0,1]
    arr = np.array(padded, dtype=np.float32) / 255.0
    arr = arr.transpose(2, 0, 1)  # HWC -> CHW
    arr = np.expand_dims(arr, 0)  # NCHW

    return arr, scale, pad_x, pad_y, orig_w, orig_h


def postprocess(output, scale, pad_x, pad_y, orig_w, orig_h, conf_threshold=0.25):
    """Parse YOLOv8 raw output [1, 67, 8400] into detections."""
    # output shape: [1, num_classes+4, num_boxes] = [1, 67, 8400]
    preds = output[0]  # [67, 8400]

    # Transpose to [8400, 67]
    if preds.shape[0] < preds.shape[1]:
        preds = preds.T  # [8400, 67]

    num_boxes = preds.shape[0]
    num_classes = preds.shape[1] - 4

    boxes_xywh = preds[:, :4]  # [8400, 4] cx, cy, w, h
    scores = preds[:, 4:]      # [8400, num_classes]

    # Get best class per box
    class_ids = np.argmax(scores, axis=1)
    confidences = np.array([scores[i, class_ids[i]] for i in range(num_boxes)])

    # Filter by confidence
    mask = confidences > conf_threshold
    if not mask.any():
        return []

    boxes_xywh = boxes_xywh[mask]
    class_ids = class_ids[mask]
    confidences = confidences[mask]

    # Convert cx,cy,w,h to x1,y1,x2,y2
    x1 = boxes_xywh[:, 0] - boxes_xywh[:, 2] / 2
    y1 = boxes_xywh[:, 1] - boxes_xywh[:, 3] / 2
    x2 = boxes_xywh[:, 0] + boxes_xywh[:, 2] / 2
    y2 = boxes_xywh[:, 1] + boxes_xywh[:, 3] / 2

    # Remove padding and rescale to original image coordinates
    x1 = (x1 - pad_x) / scale
    y1 = (y1 - pad_y) / scale
    x2 = (x2 - pad_x) / scale
    y2 = (y2 - pad_y) / scale

    # Clip to image bounds
    x1 = np.clip(x1, 0, orig_w)
    y1 = np.clip(y1, 0, orig_h)
    x2 = np.clip(x2, 0, orig_w)
    y2 = np.clip(y2, 0, orig_h)

    # NMS per class
    detections = []
    for cls_id in set(class_ids):
        cls_mask = class_ids == cls_id
        cls_x1 = x1[cls_mask]
        cls_y1 = y1[cls_mask]
        cls_x2 = x2[cls_mask]
        cls_y2 = y2[cls_mask]
        cls_conf = confidences[cls_mask]

        # Sort by confidence
        order = cls_conf.argsort()[::-1]
        keep = []
        while len(order) > 0:
            i = order[0]
            keep.append(i)
            if len(order) == 1:
                break

            # Compute IoU with remaining
            xx1 = np.maximum(cls_x1[i], cls_x1[order[1:]])
            yy1 = np.maximum(cls_y1[i], cls_y1[order[1:]])
            xx2 = np.minimum(cls_x2[i], cls_x2[order[1:]])
            yy2 = np.minimum(cls_y2[i], cls_y2[order[1:]])
            inter = np.maximum(0, xx2 - xx1) * np.maximum(0, yy2 - yy1)
            area_i = (cls_x2[i] - cls_x1[i]) * (cls_y2[i] - cls_y1[i])
            area_j = (cls_x2[order[1:]] - cls_x1[order[1:]]) * (cls_y2[order[1:]] - cls_y1[order[1:]])
            iou = inter / (area_i + area_j - inter + 1e-6)
            remaining = np.where(iou < 0.45)[0]
            order = order[remaining + 1]

        for k in keep:
            raw_name = CLASS_NAMES.get(int(cls_id), f"class_{cls_id}")
            name = clean_name(raw_name)
            bx1, by1, bx2, by2 = float(cls_x1[k]), float(cls_y1[k]), float(cls_x2[k]), float(cls_y2[k])
            bw = bx2 - bx1
            bh = by2 - by1

            # Skip tiny noise
            if (bw / orig_w) < 0.02 and (bh / orig_h) < 0.02:
                continue

            detections.append({
                "name": name,
                "confidence": f"{cls_conf[k]*100:.1f}%",
                "confidence_raw": round(float(cls_conf[k]), 4),
                "box": {
                    "x": round((bx1 / orig_w) * 100, 2),
                    "y": round((by1 / orig_h) * 100, 2),
                    "w": round((bw / orig_w) * 100, 2),
                    "h": round((bh / orig_h) * 100, 2),
                },
                "bbox_pixels": [round(bx1, 1), round(by1, 1), round(bx2, 1), round(by2, 1)],
            })

    # Sort by confidence descending
    detections.sort(key=lambda d: d["confidence_raw"], reverse=True)

    # Assign colors
    for idx, d in enumerate(detections):
        d["color"] = BOX_COLORS[idx % len(BOX_COLORS)]

    return detections


def detect(image_path_or_base64, conf=0.25):
    """Main detection function."""
    import onnxruntime as ort

    # Load model
    model_path = str(ONNX_MODEL if ONNX_MODEL.exists() else ONNX_MODEL_FULL)
    if not Path(model_path).exists():
        return {"success": False, "error": f"Model not found: {model_path}"}

    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    input_name = sess.get_inputs()[0].name

    # Load image
    p = Path(image_path_or_base64)
    if p.exists() and p.is_file():
        if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".bmp"):
            image = Image.open(p).convert("RGB")
        else:
            with open(p, "r") as f:
                b64 = f.read().strip()
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            image = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
    else:
        b64 = image_path_or_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        image = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")

    # Preprocess
    tensor, scale, pad_x, pad_y, orig_w, orig_h = preprocess(image, 320)

    # Inference
    outputs = sess.run(None, {input_name: tensor})

    # Postprocess
    detections = postprocess(outputs[0], scale, pad_x, pad_y, orig_w, orig_h, conf)

    unique = sorted(set(d["name"] for d in detections))

    return {
        "success": True,
        "detected_ingredients": detections,
        "unique_ingredients": unique,
        "count": len(unique),
        "model": "YOLOv8 Food Ingredients (ONNX)",
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No input"}))
        sys.exit(1)

    conf = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
    result = detect(sys.argv[1], conf)
    print(json.dumps(result))
