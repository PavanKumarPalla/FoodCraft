import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectIngredients as detectWithNodeOnnx } from '../utils/yoloDetector.js';

const router = express.Router();

const HF_VISION_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
  '#6366f1', '#16a34a',
];

async function callGradioSpaceVision(cleanUrl, base64Image, headers) {
  try {
    const submit = await fetch(`${cleanUrl}/gradio_api/call/detect_b64`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: [base64Image] }),
      signal: AbortSignal.timeout(30000),
    });
    if (!submit.ok) return null;
    const { event_id: eventId } = await submit.json();
    if (!eventId) return null;

    const stream = await fetch(`${cleanUrl}/gradio_api/call/detect_b64/${eventId}`, {
      headers,
      signal: AbortSignal.timeout(90000),
    });
    if (!stream.ok) return null;

    const body = await stream.text();
    let currentEvent = null;
    for (const line of body.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:') && currentEvent === 'complete') {
        const parsed = JSON.parse(line.slice(5).trim());
        const result = Array.isArray(parsed) ? parsed[0] : null;
        if (result?.success && result?.unique_ingredients?.length > 0) {
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('Gradio Space vision notice:', err.message);
  }
  return null;
}

/**
 * Call hosted fine-tuned Hugging Face Llama-3.2-Vision model (`pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision`)
 * via HF_VISION_INFERENCE_URL (HF Space / Inference Endpoint / inference_server.py)
 * or Hugging Face Router when HF_VISION_USE_ROUTER=true.
 */
async function detectWithHuggingFaceVision(base64Image) {
  const hfToken = process.env.HF_TOKEN;
  const endpointUrl = process.env.HF_VISION_INFERENCE_URL;
  const hfModelId = process.env.HF_VISION_MODEL_ID || 'pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision';
  const useRouter = String(process.env.HF_VISION_USE_ROUTER || '').toLowerCase() === 'true';

  if (!endpointUrl && !(useRouter && hfToken)) {
    return null;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (hfToken) headers.Authorization = `Bearer ${hfToken}`;

  if (endpointUrl) {
    const cleanUrl = endpointUrl.replace(/\/+$/, '');
    if (cleanUrl.includes('.hf.space')) {
      const spaceData = await callGradioSpaceVision(cleanUrl, base64Image, headers);
      if (spaceData) return spaceData;
    }
    try {
      const resp = await fetch(`${cleanUrl}/api/detect-ingredients`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64Image }),
        signal: AbortSignal.timeout(30000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && data.unique_ingredients?.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('HF_VISION_INFERENCE_URL notice:', err.message);
    }
  }

  if (useRouter && hfToken) {
    try {
      const imgUri = base64Image.startsWith('data:')
        ? base64Image
        : `data:image/jpeg;base64,${base64Image}`;
      const prompt =
        'Analyze this food image for Food Craft and reply ONLY with JSON in this format: {"ingredients": ["Item1", "Item2"], "dish": "DishNameOrNone"}.';
      const resp = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: hfModelId,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imgUri } },
              ],
            },
          ],
          max_tokens: 180,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (resp.ok) {
        const payload = await resp.json();
        const text = payload?.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const items = Array.isArray(parsed.ingredients) ? [...parsed.ingredients] : [];
          if (parsed.dish && !['none', 'null', ''].includes(String(parsed.dish).toLowerCase())) {
            if (!items.includes(parsed.dish)) items.unshift(parsed.dish);
          }
          const unique = [...new Set(items.map(s => String(s).trim()).filter(Boolean))];
          if (unique.length > 0) {
            return {
              success: true,
              detected_ingredients: unique.map((name, idx) => ({
                name,
                confidence: '94.0%',
                confidence_raw: 0.94,
                box: { x: 10 + (idx % 3) * 25, y: 10 + Math.floor(idx / 3) * 25, w: 30, h: 30 },
                bbox_pixels: [100, 100, 400, 400],
                color: HF_VISION_COLORS[idx % HF_VISION_COLORS.length],
              })),
              unique_ingredients: unique,
              count: unique.length,
              model: `FoodCraft Llama-3.2 Vision (${hfModelId})`,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Hugging Face Router Vision notice:', err.message);
    }
  }

  return null;
}

// ── Gemini Vision AI Engine ──────────────────────────────────
let geminiModel = null;

async function initGemini() {
  if (geminiModel) return geminiModel;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✨ Gemini Vision AI initialized successfully');
    return geminiModel;
  } catch (err) {
    console.warn('Gemini init warning:', err.message);
    return null;
  }
}

/**
 * Use Gemini Vision to identify food ingredients in an image.
 * Returns structured detection data compatible with the frontend.
 */
async function detectWithGemini(base64Image) {
  const model = await initGemini();
  if (!model) return null;

  // Strip data URI prefix if present
  const imageData = base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image;

  const prompt = `You are a food ingredient detection AI. Analyze this image and identify ALL visible food ingredients, dishes, or food items.

RULES:
- List EVERY distinct food item you can see
- Use simple, common ingredient names (e.g., "Tomato", "Chicken", "Rice", "Pizza", "Bread")
- Capitalize each word (Title Case)
- For dishes (pizza, burger, salad, etc.), name the dish AND its visible toppings/ingredients
- Be specific: "Bell Pepper" not "Vegetable", "Mozzarella Cheese" not "Dairy"
- Do NOT include non-food items (plates, utensils, hands, containers)

RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code fences, just raw JSON):
{"ingredients": ["Ingredient1", "Ingredient2", "Ingredient3"]}

If no food is visible, respond: {"ingredients": []}`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData,
        },
      },
    ]);

    const text = result.response.text().trim();
    // Extract JSON from response (handle markdown code fences if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const ingredients = parsed.ingredients || [];

    if (!Array.isArray(ingredients) || ingredients.length === 0) return null;

    // Build detection response compatible with frontend
    const detected = ingredients.map((name, idx) => ({
      name: String(name).trim(),
      confidence: '95.0%',
      confidence_raw: 0.95,
      box: {
        x: 10 + (idx % 3) * 25,
        y: 10 + Math.floor(idx / 3) * 25,
        w: 30,
        h: 30,
      },
      bbox_pixels: [100, 100, 400, 400],
      color: [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
        '#6366f1', '#16a34a',
      ][idx % 12],
    }));

    return {
      success: true,
      detected_ingredients: detected,
      unique_ingredients: [...new Set(ingredients.map(i => String(i).trim()))],
      count: new Set(ingredients.map(i => String(i).trim())).size,
      model: 'Gemini Vision AI',
    };
  } catch (err) {
    console.warn('Gemini Vision error:', err.message);
    return null;
  }
}

/**
 * Execute lightweight ONNX YOLOv8 detector (no PyTorch required).
 * Uses only onnxruntime + numpy + Pillow — works on Render.
 */
function runOnnxDetector(image, confidence = 0.25) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `fc_onnx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.txt`);
    try {
      fs.writeFileSync(tempFile, image, 'utf8');
    } catch (writeErr) {
      return reject(writeErr);
    }

    const scriptPath = path.join(process.cwd(), 'backend', 'scripts', 'onnx_detect.py');
    const py = spawn('python3', [scriptPath, tempFile, String(confidence)], {
      cwd: process.cwd(),
      timeout: 60000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONWARNINGS: 'ignore' }
    });

    // Also try 'python' if 'python3' fails
    py.on('error', () => {
      const py2 = spawn('python', [scriptPath, tempFile, String(confidence)], {
        cwd: process.cwd(),
        timeout: 60000,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONWARNINGS: 'ignore' }
      });

      let stdout2 = '';
      py2.stdout.on('data', chunk => { stdout2 += chunk.toString(); });
      py2.on('error', err => {
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
        reject(err);
      });
      py2.on('close', code => {
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
        const jsonMatch = stdout2.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { return resolve(JSON.parse(jsonMatch[0])); } catch {}
        }
        reject(new Error(`ONNX detector exit ${code}`));
      });
    });

    let stdout = '';
    py.stdout.on('data', chunk => { stdout += chunk.toString(); });
    py.stderr.on('data', () => {});

    py.on('close', code => {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return resolve(JSON.parse(jsonMatch[0])); } catch {}
      }
      reject(new Error(`ONNX detector exit ${code}`));
    });
  });
}

/**
 * Execute local Python YOLOv8 CLI directly when FastAPI background daemon is offline.
 * Writes image data to a temporary file to prevent Windows CLI arg length overflows.
 */
function runPythonYoloCLI(image, confidence = 0.20) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `fc_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.txt`);
    try {
      fs.writeFileSync(tempFile, image, 'utf8');
    } catch (writeErr) {
      return reject(writeErr);
    }

    const py = spawn('python', ['-m', 'backend.scripts.detect_cli', tempFile, String(confidence)], {
      cwd: process.cwd(),
      timeout: 35000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONWARNINGS: 'ignore' }
    });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', chunk => { stdout += chunk.toString(); });
    py.stderr.on('data', chunk => { stderr += chunk.toString(); });

    py.on('error', err => {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
      reject(err);
    });

    py.on('close', code => {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
      
      // Extract the JSON object from stdout even if Python or PyTorch printed warnings
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.success) {
            return resolve(parsed);
          }
        } catch (parseErr) {
          console.warn('JSON parse warning:', parseErr.message);
        }
      }

      if (code === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          return resolve(parsed);
        } catch (parseErr) {
          reject(new Error(`Failed to parse YOLO CLI JSON: ${parseErr.message}`));
        }
      } else {
        reject(new Error(`Python detector exited with code ${code}: ${stderr.slice(0, 150)}`));
      }
    });
  });
}

// ── GET /api/recipes/health ───────────────────────────────────
router.get('/recipes/health', async (req, res) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:8000' : null);
  let fastApiStatus = 'offline';

  if (aiServiceUrl) {
    try {
      const resp = await fetch(`${aiServiceUrl}/api/recipes/health`, { signal: AbortSignal.timeout(1500) });
      if (resp.ok) {
        fastApiStatus = 'connected';
      }
    } catch {
      fastApiStatus = 'offline';
    }
  }

  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  const hfVisionModel = process.env.HF_VISION_MODEL_ID || 'pavankumarpalla/FoodCraft-Llama-3.2-11B-Vision';
  const hfEndpointConfigured = !!process.env.HF_VISION_INFERENCE_URL;
  const hfRouterEnabled = String(process.env.HF_VISION_USE_ROUTER || '').toLowerCase() === 'true' && !!process.env.HF_TOKEN;

  res.json({
    status: 'online',
    engine: 'Food Craft AI Router',
    fastapi_backend: fastApiStatus,
    gemini_vision: geminiAvailable ? 'available' : 'no_api_key',
    hf_vision: {
      model: hfVisionModel,
      status: hfEndpointConfigured ? 'endpoint_configured' : (hfRouterEnabled ? 'router_enabled' : 'standby'),
    },
    timestamp: new Date().toISOString()
  });
});

// ── POST /api/detect-ingredients ──────────────────────────────
router.post('/detect-ingredients', async (req, res) => {
  const { image, confidence = 0.25 } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, error: 'No image data provided' });
  }

  // 0. Fine-tuned FoodCraft Llama-3.2-Vision on Hugging Face (when endpoint/router configured)
  try {
    const hfVisionResult = await detectWithHuggingFaceVision(image);
    if (hfVisionResult && hfVisionResult.success && hfVisionResult.detected_ingredients?.length > 0) {
      console.log(`🦙 Hugging Face Vision (${hfVisionResult.model}): ${hfVisionResult.count} items detected`);
      return res.json(hfVisionResult);
    }
  } catch (hfErr) {
    console.warn('HF Vision notice:', hfErr.message);
  }

  // 1. Node.js YOLOv8 ONNX detector (works on Render, no Python needed)
  let onnxNodeRan = false;
  try {
    const onnxNodeResult = await detectWithNodeOnnx(image, confidence);
    if (onnxNodeResult && onnxNodeResult.success) {
      onnxNodeRan = true;
      if (onnxNodeResult.detected_ingredients && onnxNodeResult.detected_ingredients.length > 0) {
        console.log(`✅ Node.js YOLOv8 ONNX: ${onnxNodeResult.count} ingredients detected`);
        return res.json(onnxNodeResult);
      }
      // Model ran but found nothing — still report the model so frontend
      // knows AI ran (prevents client-side HSV false positives)
      console.log('Node.js YOLOv8 ONNX ran but detected 0 ingredients');
    }
  } catch (onnxNodeErr) {
    console.warn('Node.js YOLOv8 ONNX notice:', onnxNodeErr.message);
  }

  // 2. Forward to FastAPI YOLOv8 daemon if running
  const aiServiceUrl = process.env.AI_SERVICE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:8000' : null);

  if (aiServiceUrl) {
    try {
      const pyRes = await fetch(`${aiServiceUrl}/api/detect-ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, confidence }),
        signal: AbortSignal.timeout(35000)
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (pyData && pyData.success && pyData.detected_ingredients && pyData.detected_ingredients.length > 0) {
          return res.json(pyData);
        }
      }
    } catch {
      // Backend daemon not responding
    }
  }

  // 3. Direct Python CLI execution fallback (uses yolov8_food_ingredients.pt)
  try {
    const cliData = await runPythonYoloCLI(image, confidence);
    if (cliData && cliData.success && cliData.detected_ingredients && cliData.detected_ingredients.length > 0) {
      return res.json(cliData);
    }
  } catch (cliErr) {
    console.warn('Python YOLOv8 CLI notice:', cliErr.message);
  }

  // 4. Python ONNX YOLOv8 detector (lightweight, works on Render without PyTorch)
  try {
    const onnxData = await runOnnxDetector(image, confidence);
    if (onnxData && onnxData.success && onnxData.detected_ingredients && onnxData.detected_ingredients.length > 0) {
      return res.json(onnxData);
    }
  } catch (onnxErr) {
    console.warn('ONNX YOLOv8 detector notice:', onnxErr.message);
  }

  // 5. Gemini Vision AI — works on Render without Python
  try {
    const geminiData = await detectWithGemini(image);
    if (geminiData && geminiData.success && geminiData.unique_ingredients.length > 0) {
      return res.json(geminiData);
    }
  } catch (geminiErr) {
    console.warn('Gemini Vision notice:', geminiErr.message);
  }

  // 6. No detection engine available — but if ONNX ran, report its model name
  //    so the frontend knows AI actually ran (prevents HSV false-positive fallback)
  return res.json({
    success: true,
    detected_ingredients: [],
    unique_ingredients: [],
    count: 0,
    model: onnxNodeRan ? 'YOLOv8 Food Ingredients (ONNX)' : 'none',
    backend_status: onnxNodeRan ? 'online' : 'offline',
    message: onnxNodeRan
      ? 'YOLOv8 ran but found no known food ingredients. Try a clearer photo or enter items manually.'
      : 'No AI backend available. Please set GEMINI_API_KEY environment variable or start the Python backend.'
  });
});

// ── POST /api/recommend-recipes ───────────────────────────────
router.post('/recommend-recipes', async (req, res) => {
  const { ingredients = [], top_k = 20 } = req.body;

  // Forward to FastAPI SBERT + FAISS backend if reachable
  const aiServiceUrl = process.env.AI_SERVICE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:8000' : null);

  if (aiServiceUrl) {
    try {
      const pyRes = await fetch(`${aiServiceUrl}/api/recommend-recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, top_k, include_images: true }),
        signal: AbortSignal.timeout(5000)
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        return res.json(pyData);
      }
    } catch {
      // Backend not running
    }
  }

  return res.json({
    success: true,
    query_ingredients: ingredients,
    count: 0,
    recipes: []
  });
});

export default router;
