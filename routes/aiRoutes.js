import express from 'express';

const router = express.Router();

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

  // Forward to FastAPI YOLOv8 backend if reachable
  const aiServiceUrl = process.env.AI_SERVICE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:8000' : null);

  if (aiServiceUrl) {
    try {
      const pyRes = await fetch(`${aiServiceUrl}/api/detect-ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, confidence }),
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

  // When backend is not active, return empty detections honestly (never fake Kiwi/Tomatoes)
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
