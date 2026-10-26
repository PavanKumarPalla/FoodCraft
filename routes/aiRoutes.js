import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = express.Router();

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

  res.json({
    status: 'online',
    engine: 'Food Craft AI Router',
    fastapi_backend: fastApiStatus,
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
        signal: AbortSignal.timeout(6000)
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (pyData && pyData.success && pyData.detected_ingredients) {
          return res.json(pyData);
        }
      }
    } catch {
      // Backend daemon not responding — fallback to direct CLI
    }
  }

  // 2. Direct Python CLI execution fallback (uses yolov8_food_ingredients.pt)
  try {
    const cliData = await runPythonYoloCLI(image, confidence);
    if (cliData && cliData.success) {
      return res.json(cliData);
    }
  } catch (cliErr) {
    console.warn('Direct Python YOLOv8 CLI fallback notice:', cliErr.message);
  }

  // 3. Fallback when Python is not present in environment (pure static container)
  return res.json({
    success: true,
    detected_ingredients: [],
    unique_ingredients: [],
    count: 0,
    model: 'YOLOv8',
    backend_status: 'offline',
    message: 'FastAPI YOLOv8 backend is not connected. Use client-side vision or start python backend/run.py.'
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
