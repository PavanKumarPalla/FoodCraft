/**
 * YOLOv8 Food Ingredient Detector — Pure Node.js (No Python Required)
 * ──────────────────────────────────────────────────────────────────
 * Uses onnxruntime-node + sharp to run YOLOv8 inference directly in Node.js.
 * Works on Render without any Python dependencies.
 */

import ort from 'onnxruntime-node';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Model paths
const MODEL_Q8 = path.join(__dirname, '..', 'backend', 'models', 'yolov8_food_ingredients_q8.onnx');
const MODEL_FULL = path.join(__dirname, '..', 'backend', 'models', 'yolov8_food_ingredients.onnx');

// Singleton session
let _session = null;
let _inputName = null;
let _imgsz = 320;

// 63 food ingredient class names
const CLASS_NAMES = {
  0: 'Almond', 1: 'Apple', 2: 'Apricot', 3: 'Artichoke', 4: 'Asparagus',
  5: 'Avocado', 6: 'Banana', 7: 'Tofu', 8: 'Bell Pepper',
  9: 'Blackberry', 10: 'Blueberry', 11: 'Broccoli', 12: 'Brussels Sprouts',
  13: 'Cantaloupe', 14: 'Carrot', 15: 'Cauliflower',
  16: 'Chili Pepper', 17: 'Celery', 18: 'Cherry', 19: 'Chickpeas',
  20: 'Chili', 21: 'Clementine', 22: 'Coconut', 23: 'Corn',
  24: 'Cucumber', 25: 'Dates', 26: 'Eggplant',
  27: 'Fig', 28: 'Garlic', 29: 'Ginger',
  30: 'Strawberry', 31: 'Gourd', 32: 'Grape',
  33: 'Green Beans', 34: 'Spring Onion', 35: 'Tomato',
  36: 'Kiwi', 37: 'Lemon', 38: 'Lettuce', 39: 'Lime',
  40: 'Mandarin', 41: 'Melon', 42: 'Mushroom', 43: 'Onion',
  44: 'Orange', 45: 'Papaya', 46: 'Peas',
  47: 'Peach', 48: 'Pear', 49: 'Persimmon', 50: 'Pickle',
  51: 'Pineapple', 52: 'Potato', 53: 'Prune', 54: 'Pumpkin',
  55: 'Radish', 56: 'Raspberry', 57: 'Strawberry',
  58: 'Sweet Potato', 59: 'Tomato', 60: 'Turnip', 61: 'Watermelon',
  62: 'Zucchini'
};

const BOX_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
  '#6366f1', '#16a34a'
];

/**
 * Load the ONNX model session (singleton).
 */
async function loadModel() {
  if (_session) return _session;

  const fs = await import('fs');
  let modelPath = MODEL_Q8;
  if (!fs.existsSync(modelPath)) {
    modelPath = MODEL_FULL;
    if (!fs.existsSync(modelPath)) {
      throw new Error(`No ONNX model found at ${MODEL_Q8} or ${MODEL_FULL}`);
    }
  }

  console.log(`Loading YOLOv8 ONNX model: ${path.basename(modelPath)}`);
  _session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['cpu'],
  });

  _inputName = _session.inputNames[0];
  const inputShape = _session.inputNames.length > 0
    ? _session._model?.graph?.input?.[0]?.type?.tensorType?.shape?.dim
    : null;

  // Get input size from model metadata
  const meta = _session.inputNames;
  console.log(`YOLOv8 ONNX model loaded. Input: ${_inputName}`);

  return _session;
}

/**
 * Preprocess image: resize + letterbox pad to imgsz x imgsz.
 */
async function preprocessImage(imageBuffer) {
  const metadata = await sharp(imageBuffer).metadata();
  const origW = metadata.width;
  const origH = metadata.height;

  const scale = Math.min(_imgsz / origW, _imgsz / origH);
  const newW = Math.round(origW * scale);
  const newH = Math.round(origH * scale);
  const padX = Math.floor((_imgsz - newW) / 2);
  const padY = Math.floor((_imgsz - newH) / 2);

  // Resize and pad with gray (114, 114, 114)
  const paddedBuffer = await sharp(imageBuffer)
    .resize(newW, newH, { fit: 'fill' })
    .extend({
      top: padY,
      bottom: _imgsz - newH - padY,
      left: padX,
      right: _imgsz - newW - padX,
      background: { r: 114, g: 114, b: 114 },
    })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Convert HWC RGB to NCHW float32 [0,1]
  const floatData = new Float32Array(_imgsz * _imgsz * 3);
  const pixels = _imgsz * _imgsz;

  for (let i = 0; i < pixels; i++) {
    floatData[i] = paddedBuffer[i * 3] / 255.0;              // R channel
    floatData[pixels + i] = paddedBuffer[i * 3 + 1] / 255.0; // G channel
    floatData[2 * pixels + i] = paddedBuffer[i * 3 + 2] / 255.0; // B channel
  }

  return { floatData, scale, padX, padY, origW, origH };
}

/**
 * Run NMS on detections for a single class.
 */
function nmsForClass(detections, iouThreshold = 0.45) {
  detections.sort((a, b) => b.conf - a.conf);
  const keep = [];

  for (const det of detections) {
    let dominated = false;
    for (const kept of keep) {
      const xx1 = Math.max(det.x1, kept.x1);
      const yy1 = Math.max(det.y1, kept.y1);
      const xx2 = Math.min(det.x2, kept.x2);
      const yy2 = Math.min(det.y2, kept.y2);
      const inter = Math.max(0, xx2 - xx1) * Math.max(0, yy2 - yy1);
      const areaA = (det.x2 - det.x1) * (det.y2 - det.y1);
      const areaB = (kept.x2 - kept.x1) * (kept.y2 - kept.y1);
      const iou = inter / (areaA + areaB - inter + 1e-6);
      if (iou > iouThreshold) {
        dominated = true;
        break;
      }
    }
    if (!dominated) keep.push(det);
  }
  return keep;
}

/**
 * Detect food ingredients in a base64 image.
 * @param {string} base64Image - Base64 encoded image (with or without data URI prefix)
 * @param {number} confThreshold - Minimum confidence threshold (default 0.20)
 * @returns {object} Detection results
 */
export async function detectIngredients(base64Image, confThreshold = 0.20) {
  try {
    const session = await loadModel();

    // Decode base64 image
    let imageData = base64Image;
    if (imageData.includes(',')) {
      imageData = imageData.split(',')[1];
    }
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Preprocess
    const { floatData, scale, padX, padY, origW, origH } = await preprocessImage(imageBuffer);

    // Create input tensor
    const inputTensor = new ort.Tensor('float32', floatData, [1, 3, _imgsz, _imgsz]);

    // Run inference
    const results = await session.run({ [_inputName]: inputTensor });
    const outputName = session.outputNames[0];
    const output = results[outputName];
    const data = output.data;
    const shape = output.dims; // [1, num_classes+4, num_boxes]

    const numPreds = shape[1]; // 67 (4 + 63 classes)
    const numBoxes = shape[2]; // 8400 or similar
    const numClasses = numPreds - 4;

    // Parse detections: output is [1, 67, N] where first 4 rows are cx,cy,w,h
    const rawDetections = {};

    for (let b = 0; b < numBoxes; b++) {
      const cx = data[0 * numBoxes + b];
      const cy = data[1 * numBoxes + b];
      const w = data[2 * numBoxes + b];
      const h = data[3 * numBoxes + b];

      // Find best class
      let bestClass = 0;
      let bestScore = 0;
      for (let c = 0; c < numClasses; c++) {
        const score = data[(4 + c) * numBoxes + b];
        if (score > bestScore) {
          bestScore = score;
          bestClass = c;
        }
      }

      if (bestScore < confThreshold) continue;

      // Convert from padded coords to original image coords
      let x1 = (cx - w / 2 - padX) / scale;
      let y1 = (cy - h / 2 - padY) / scale;
      let x2 = (cx + w / 2 - padX) / scale;
      let y2 = (cy + h / 2 - padY) / scale;

      // Clip to image bounds
      x1 = Math.max(0, Math.min(origW, x1));
      y1 = Math.max(0, Math.min(origH, y1));
      x2 = Math.max(0, Math.min(origW, x2));
      y2 = Math.max(0, Math.min(origH, y2));

      const bw = x2 - x1;
      const bh = y2 - y1;

      // Skip tiny noise
      if ((bw / origW) < 0.02 && (bh / origH) < 0.02) continue;

      if (!rawDetections[bestClass]) rawDetections[bestClass] = [];
      rawDetections[bestClass].push({ x1, y1, x2, y2, conf: bestScore, cls: bestClass });
    }

    // Apply per-class NMS
    const allDetections = [];
    for (const cls in rawDetections) {
      const kept = nmsForClass(rawDetections[cls], 0.45);
      allDetections.push(...kept);
    }

    // Sort by confidence
    allDetections.sort((a, b) => b.conf - a.conf);

    // Format output
    const detected = allDetections.map((det, idx) => {
      const name = CLASS_NAMES[det.cls] || `Class_${det.cls}`;
      const bw = det.x2 - det.x1;
      const bh = det.y2 - det.y1;
      return {
        name,
        confidence: `${(det.conf * 100).toFixed(1)}%`,
        confidence_raw: Math.round(det.conf * 10000) / 10000,
        box: {
          x: Math.round((det.x1 / origW) * 10000) / 100,
          y: Math.round((det.y1 / origH) * 10000) / 100,
          w: Math.round((bw / origW) * 10000) / 100,
          h: Math.round((bh / origH) * 10000) / 100,
        },
        bbox_pixels: [
          Math.round(det.x1 * 10) / 10,
          Math.round(det.y1 * 10) / 10,
          Math.round(det.x2 * 10) / 10,
          Math.round(det.y2 * 10) / 10,
        ],
        color: BOX_COLORS[idx % BOX_COLORS.length],
      };
    });

    const uniqueIngredients = [...new Set(detected.map(d => d.name))].sort();

    return {
      success: true,
      detected_ingredients: detected,
      unique_ingredients: uniqueIngredients,
      count: uniqueIngredients.length,
      model: 'YOLOv8 Food Ingredients (ONNX)',
    };
  } catch (err) {
    console.error('YOLOv8 ONNX detection error:', err.message);
    return { success: false, error: err.message };
  }
}
