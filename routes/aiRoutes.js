import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = express.Router();

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

  res.json({
    status: 'online',
    engine: 'Food Craft AI Router',
    fastapi_backend: fastApiStatus,
    gemini_vision: geminiAvailable ? 'available' : 'no_api_key',
    timestamp: new Date().toISOString()
  });
});

// ── POST /api/detect-ingredients ──────────────────────────────
router.post('/detect-ingredients', async (req, res) => {
  const { image, confidence = 0.25 } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, error: 'No image data provided' });
  }

  // 1. Forward to FastAPI YOLOv8 daemon if running
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

  // 2. Direct Python CLI execution fallback (uses yolov8_food_ingredients.pt)
  try {
    const cliData = await runPythonYoloCLI(image, confidence);
    if (cliData && cliData.success && cliData.detected_ingredients && cliData.detected_ingredients.length > 0) {
      return res.json(cliData);
    }
  } catch (cliErr) {
    console.warn('Python YOLOv8 CLI notice:', cliErr.message);
  }

  // 3. Gemini Vision AI — works on Render without Python
  try {
    const geminiData = await detectWithGemini(image);
    if (geminiData && geminiData.success && geminiData.unique_ingredients.length > 0) {
      return res.json(geminiData);
    }
  } catch (geminiErr) {
    console.warn('Gemini Vision notice:', geminiErr.message);
  }

  // 4. No detection engine available
  return res.json({
    success: true,
    detected_ingredients: [],
    unique_ingredients: [],
    count: 0,
    model: 'none',
    backend_status: 'offline',
    message: 'No AI backend available. Please set GEMINI_API_KEY environment variable or start the Python backend.'
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
