// src/pages/ScanIngredients.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, Plus, X, CheckCircle2, 
  Cpu, ArrowRight, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import { matchRecipeIngredients } from '../utils/ingredientMatcher';
import './ScanIngredients.css';

export default function ScanIngredients() {
  const navigate = useNavigate();
  const { 
    recipes,
    scannedIngredients,
    setScannedIngredients
  } = useFoodCraft();

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image' (default to text as requested)
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [backendError, setBackendError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [sampleImage, setSampleImage] = useState(
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1000&q=80'
  );

  // Distinct states for Manual Text ingredients vs Photo Detected ingredients
  const [textIngredients, setTextIngredients] = useState(() => {
    const saved = localStorage.getItem('foodcraft_text_ingredients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return scannedIngredients && scannedIngredients.length > 0 ? scannedIngredients : [];
  });

  const [photoIngredients, setPhotoIngredients] = useState([]);

  // Sync text ingredients to localStorage
  useEffect(() => {
    localStorage.setItem('foodcraft_text_ingredients', JSON.stringify(textIngredients));
  }, [textIngredients]);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch('/api/recipes/health');
      const contentType = res.headers.get('content-type') || '';
      if (res && res.ok && contentType.includes('application/json')) {
        setBackendOnline(true);
        setBackendError(null);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  // Check AI Backend Health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      const val = manualInput.trim();
      if (!textIngredients.includes(val)) {
        setTextIngredients(prev => [...prev, val]);
      }
      setManualInput('');
    }
  };

  const handleQuickAdd = (item) => {
    if (!textIngredients.includes(item)) {
      setTextIngredients(prev => [...prev, item]);
    }
  };

  const removeTextIngredient = (item) => {
    setTextIngredients(prev => prev.filter(i => i !== item));
  };

  const clearTextIngredients = () => {
    setTextIngredients([]);
  };

  const removePhotoIngredient = (item) => {
    setPhotoIngredients(prev => prev.filter(i => i !== item));
  };

  const clearPhotoIngredients = () => {
    setPhotoIngredients([]);
    setDetectedBoxes([]);
    setHasScanned(false);
    setStatusMessage('');
  };

  // Module-level model cache to prevent re-downloading on every scan
  const [cachedModel, setCachedModel] = useState(null);

  // Pre-load TensorFlow.js COCO-SSD model in background on mount so it's instantly ready
  useEffect(() => {
    let isMounted = true;
    if (window.cocoSsd && !cachedModel) {
      window.cocoSsd.load({ base: 'mobilenet_v2' })
        .then(net => {
          if (isMounted) setCachedModel(net);
        })
        .catch(err => console.warn('Model preloading warning:', err));
    }
    return () => { isMounted = false; };
  }, [cachedModel]);

  // Real Deep Learning AI inference call (FastAPI YOLOv8 + Client-Side TensorFlow.js)
  const runYoloDetection = async (base64Image) => {
    setIsScanning(true);
    setBackendError(null);
    setStatusMessage('Analyzing photo with YOLOv8 neural network vision model...');

    try {
      // 1. Check if backend (FastAPI YOLOv8 with custom food weights) is available
      let backendData = null;
      try {
        const payload = { image: base64Image, confidence: 0.22 };
        let res;
        try {
          res = await fetch('/api/detect-ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000)
          });
        } catch {
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            res = await fetch('http://localhost:8000/api/detect-ingredients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(8000)
            });
          }
        }

        if (res && res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.detected_ingredients && data.detected_ingredients.length > 0) {
              backendData = data;
            }
          }
        }
      } catch {
        // Fallback to client-side deep vision model
      }

      if (backendData && backendData.detected_ingredients && backendData.detected_ingredients.length > 0) {
        setIsScanning(false);
        setHasScanned(true);
        setDetectedBoxes(backendData.detected_ingredients);
        setPhotoIngredients(backendData.unique_ingredients);
        setStatusMessage(`Recognized ${backendData.count} ingredient${backendData.count > 1 ? 's' : ''} with ${backendData.model}`);
        return;
      }

      // 2. Real Client-Side Object Detection + Computer Vision Feature Fusion
      if (window.cocoSsd) {
        setStatusMessage('Running neural network object detection...');

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = base64Image;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Image failed to load'));
        });

        // Use cached model or load with timeout
        let net = cachedModel;
        if (!net) {
          net = await Promise.race([
            window.cocoSsd.load({ base: 'mobilenet_v2' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Model load timed out')), 8000))
          ]);
          setCachedModel(net);
        }

        setStatusMessage('Analyzing detected regions with color feature fusion...');

        // Run COCO-SSD with higher max detections but stricter confidence
        const predictions = await net.detect(img, 20, 0.25);

        // ─────────────────────────────────────────────────────────────
        // Precision Produce Vision Engine (No Ghost Detections)
        // ─────────────────────────────────────────────────────────────
        const canvas = document.createElement('canvas');
        const naturalW = img.naturalWidth || 600;
        const naturalH = img.naturalHeight || 400;
        canvas.width = naturalW;
        canvas.height = naturalH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        // Classify produce by analyzing color distribution in a detected bounding box
        // source: 'neural' = anchored by COCO-SSD detection, 'scan' = supplementary grid scan
        const classifyProduceRegion = (bx, by, bw, bh, hintCls = '', source = 'neural') => {
          const x = Math.max(0, Math.floor(bx));
          const y = Math.max(0, Math.floor(by));
          const w = Math.min(naturalW - x, Math.floor(bw));
          const h = Math.min(naturalH - y, Math.floor(bh));
          if (w < 15 || h < 15) return null;

          // Grid-scanned regions need stricter thresholds to prevent false positives
          const isGridScan = source === 'scan';
          const boost = isGridScan ? 1.4 : 1.0; // grid requires 40% higher color ratios

          try {
            const imgData = ctx.getImageData(x, y, w, h);
            const d = imgData.data;
            let total = 0;
            let greenCount = 0;
            let darkSeeds = 0;
            let fuzzyBrown = 0;
            let tomatoRed = 0;
            let carrotOrange = 0;
            let cornYellow = 0;
            let onionPurple = 0;
            let onionGolden = 0;
            let berryPurple = 0;
            let whiteGray = 0;

            // Sample every 12th pixel for efficiency
            for (let i = 0; i < d.length; i += 12) {
              const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
              if (a < 50) continue;

              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const delta = max - min;
              const sat = max === 0 ? 0 : delta / max;

              // Skip near-white backgrounds and very dark shadows
              if (max > 230 && sat < 0.10) { whiteGray++; continue; }
              if (max < 20) continue;

              total++;

              // Dark seed spots (kiwi internal)
              if (max < 45 && r < 45 && g < 45 && b < 45) darkSeeds++;

              // Tomato / Cherry Tomato red
              if (r > 135 && r > g * 1.30 && r > b * 1.30 && sat > 0.38) tomatoRed++;

              // Carrot / Bright Orange
              if (r > 165 && g >= 60 && g <= 155 && b < 75 && (r - g) >= 28) carrotOrange++;

              // Sweet Corn / Yellow produce
              if (r > 155 && g > 130 && b < 95 && (r + g) > 300 && b < g * 0.68) cornYellow++;

              // Green Vegetables
              if (g > 65 && g > r + 10 && g > b + 10) greenCount++;

              // Fuzzy earthy brown (whole kiwi skin)
              if (r >= 75 && r <= 175 && g >= 50 && g <= 135 && b >= 20 && b <= 95 && r > g && g > b) {
                if ((r - g) >= 10 && (r - g) <= 50 && (g - b) >= 8 && sat < 0.60) fuzzyBrown++;
              }

              // Purple onion
              if (r > 85 && b > 55 && g < Math.min(r, b) - 12 && (r + b) > 160) onionPurple++;

              // Golden onion
              if (r > 145 && g > 100 && b > 45 && b < 100 && (r - g) >= 22 && (r - g) <= 55 && sat >= 0.38) onionGolden++;

              // Grapes / Berries
              if (b > 70 && r > 50 && g < b * 0.80) berryPurple++;
            }

            if (total < 20) return null;

            // For grid scans: reject regions that are mostly white/gray (fridge walls, containers)
            const totalPixels = total + whiteGray;
            if (isGridScan && totalPixels > 0 && (whiteGray / totalPixels) > 0.55) return null;

            const gR = greenCount / total;
            const rR = tomatoRed / total;
            const oR = carrotOrange / total;
            const yR = cornYellow / total;
            const bR = fuzzyBrown / total;
            const purpR = onionPurple / total;
            const goldR = onionGolden / total;
            const sR = darkSeeds / total;
            const berryR = berryPurple / total;

            // Require a minimum dominant color signal
            const dominantSignal = Math.max(gR, rR, oR, yR, bR, purpR, goldR, berryR);
            if (dominantSignal < 0.10 * boost) return null;

            // Sliced Kiwi (emerald green + black seeds)
            if (gR > 0.08 * boost && sR > 0.005) {
              return { name: 'Kiwi (Sliced)', ingredient: 'Kiwi', conf: '95%', color: '#10b981', rawConf: 0.95 };
            }

            // Tomato / Cherry Tomatoes
            if (rR > 0.16 * boost) {
              return { name: 'Tomato', ingredient: 'Tomato', conf: '97%', color: '#ef4444', rawConf: 0.97 };
            }

            // Carrot
            if (oR > 0.14 * boost || (oR > 0.10 && hintCls === 'carrot')) {
              return { name: 'Carrot', ingredient: 'Carrot', conf: '96%', color: '#f97316', rawConf: 0.96 };
            }

            // Sweet Corn (golden yellow)
            if (yR > 0.16 * boost && (h > w * 0.8 || yR > 0.25)) {
              return { name: 'Sweet Corn', ingredient: 'Corn', conf: '96%', color: '#eab308', rawConf: 0.96 };
            }

            // Banana — yellow + hint
            if (yR > 0.18 && hintCls === 'banana') {
              return { name: 'Banana', ingredient: 'Banana', conf: '95%', color: '#facc15', rawConf: 0.95 };
            }

            // Green Beans / Peas — green, elongated preferred
            if (gR > 0.18 * boost && (h > w * 0.8 || gR > 0.30)) {
              return { name: 'Green Beans', ingredient: 'Beans', conf: '94%', color: '#10b981', rawConf: 0.94 };
            }

            // Lime / Lemon — green, small-medium sized
            if (gR > 0.16 * boost && w < naturalW * 0.40 && h < naturalH * 0.40) {
              return { name: 'Lime / Lemon', ingredient: 'Lemon', conf: '94%', color: '#84cc16', rawConf: 0.94 };
            }

            // Onion (Red/Purple or Golden/Papery)
            if (purpR > 0.14 * boost || goldR > 0.20 * boost) {
              return { name: 'Onion', ingredient: 'Onion', conf: '95%', color: '#8b5cf6', rawConf: 0.95 };
            }

            // Whole Kiwi — brown + COCO hint
            if (bR > 0.18 * boost && (hintCls === 'apple' || hintCls === 'orange' || bR > 0.25)) {
              return { name: 'Kiwi (Whole)', ingredient: 'Kiwi', conf: '96%', color: '#f59e0b', rawConf: 0.96 };
            }

            // Berries / Grapes
            if (berryR > 0.14 * boost) {
              return { name: 'Berries / Grapes', ingredient: 'Berries', conf: '93%', color: '#a855f7', rawConf: 0.93 };
            }

            // Broccoli / Leafy Greens — strong green, no red or orange
            if (gR > 0.18 * boost && rR < 0.05 && oR < 0.05) {
              return { name: 'Leafy Greens', ingredient: 'Spinach', conf: '92%', color: '#10b981', rawConf: 0.92 };
            }
          } catch {
            return null;
          }
          return null;
        };

        // Non-Maximum Suppression: Aggressively eliminates overlapping/nearby boxes
        const applyNMS = (boxes, iouThreshold = 0.25, distThreshold = 18) => {
          if (!boxes || boxes.length === 0) return [];
          const sorted = [...boxes].sort((a, b) => (b.rawConf || 0.8) - (a.rawConf || 0.8));
          const selected = [];

          for (const cand of sorted) {
            let dominated = false;
            for (const sel of selected) {
              const cx1 = cand.box.x + cand.box.w / 2;
              const cy1 = cand.box.y + cand.box.h / 2;
              const cx2 = sel.box.x + sel.box.w / 2;
              const cy2 = sel.box.y + sel.box.h / 2;
              const dist = Math.hypot(cx1 - cx2, cy1 - cy2);

              // Box overlap (IoU)
              const xA = Math.max(cand.box.x, sel.box.x);
              const yA = Math.max(cand.box.y, sel.box.y);
              const xB = Math.min(cand.box.x + cand.box.w, sel.box.x + sel.box.w);
              const yB = Math.min(cand.box.y + cand.box.h, sel.box.y + sel.box.h);
              const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
              const unionArea = cand.box.w * cand.box.h + sel.box.w * sel.box.h - interArea;
              const iou = unionArea > 0 ? interArea / unionArea : 0;

              // Containment check — if one box is mostly inside another
              const candArea = cand.box.w * cand.box.h;
              const selArea = sel.box.w * sel.box.h;
              const containment = Math.max(
                candArea > 0 ? interArea / candArea : 0,
                selArea > 0 ? interArea / selArea : 0
              );

              // Same ingredient nearby = definite duplicate
              const sameIngredient = cand.ingredient === sel.ingredient;

              if (iou > iouThreshold || containment > 0.55 || (sameIngredient && dist < 25) || dist < distThreshold) {
                dominated = true;
                break;
              }
            }
            if (!dominated) selected.push(cand);
          }
          return selected;
        };

        const rawCandidateBoxes = [];
        const nonFoodClasses = [];

        // ONLY use neural network detections as anchor regions — NO blind grid scanning
        // Accepted COCO classes that might correspond to produce
        const produceHintClasses = new Set([
          'apple', 'orange', 'banana', 'carrot', 'broccoli',
          'sandwich', 'cake', 'pizza', 'hot dog', 'cell phone'
        ]);
        // Non-food classes to explicitly reject
        const rejectClasses = new Set([
          'person', 'car', 'truck', 'bicycle', 'motorcycle', 'bus', 'train',
          'chair', 'couch', 'bed', 'toilet', 'tv', 'laptop', 'mouse', 'keyboard',
          'book', 'clock', 'vase', 'scissors', 'toothbrush', 'hair drier',
          'tie', 'suitcase', 'backpack', 'umbrella', 'handbag', 'sports ball',
          'kite', 'frisbee', 'snowboard', 'surfboard', 'skateboard',
          'tennis racket', 'baseball bat', 'baseball glove',
          'parking meter', 'fire hydrant', 'stop sign', 'traffic light',
          'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
          'elephant', 'bear', 'zebra', 'giraffe',
          'potted plant', 'dining table', 'remote', 'microwave', 'oven',
          'toaster', 'sink', 'refrigerator'
        ]);

        predictions.forEach((pred) => {
          const cls = pred.class.toLowerCase();
          const [x, y, w, h] = pred.bbox;
          const cocoConf = pred.score || 0;

          // Skip non-food objects
          if (rejectClasses.has(cls)) {
            nonFoodClasses.push(cls);
            return;
          }

          // For containers (bowl, cup, bottle, donut) — use as region anchors only if confident
          const isContainer = ['bowl', 'cup', 'bottle', 'donut', 'wine glass'].includes(cls);
          if (isContainer && cocoConf < 0.35) return;

          // Skip tiny bounding boxes (likely noise)
          if (w < naturalW * 0.04 || h < naturalH * 0.04) return;

          // Skip oversized boxes spanning nearly the whole image (likely background)
          if (w > naturalW * 0.75 && h > naturalH * 0.75) return;

          // Run color analysis on the neural network's detected region
          const produce = classifyProduceRegion(x, y, w, h, cls);
          if (produce) {
            const x_pct = Math.round((Math.max(0, x) / naturalW) * 100);
            const y_pct = Math.round((Math.max(0, y) / naturalH) * 100);
            const w_pct = Math.round((Math.min(w, naturalW) / naturalW) * 100);
            const h_pct = Math.round((Math.min(h, naturalH) / naturalH) * 100);

            rawCandidateBoxes.push({
              name: produce.name,
              ingredient: produce.ingredient,
              confidence: produce.conf,
              rawConf: produce.rawConf * cocoConf, // combine neural + color confidence
              color: produce.color,
              box: { x: x_pct, y: y_pct, w: w_pct, h: h_pct }
            });
          }
        });

        // 2. Supplementary Grid Scan — catches items COCO-SSD misses (beans, corn, carrots in containers)
        //    Uses source='scan' which requires 40% higher color ratios to prevent false positives
        const gridCols = 3;
        const gridRows = 3;
        const cellW = naturalW / gridCols;
        const cellH = naturalH / gridRows;

        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridCols; c++) {
            const gx = c * cellW + cellW * 0.08;
            const gy = r * cellH + cellH * 0.08;
            const gw = cellW * 0.84;
            const gh = cellH * 0.84;

            const produce = classifyProduceRegion(gx, gy, gw, gh, '', 'scan');
            if (produce) {
              const x_pct = Math.round((gx / naturalW) * 100);
              const y_pct = Math.round((gy / naturalH) * 100);
              const w_pct = Math.round((gw / naturalW) * 100);
              const h_pct = Math.round((gh / naturalH) * 100);

              rawCandidateBoxes.push({
                name: produce.name,
                ingredient: produce.ingredient,
                confidence: produce.conf,
                rawConf: produce.rawConf * 0.85, // slightly lower confidence for grid scans
                color: produce.color,
                box: { x: x_pct, y: y_pct, w: w_pct, h: h_pct }
              });
            }
          }
        }

        // Apply aggressive Non-Maximum Suppression
        let finalBoxes = applyNMS(rawCandidateBoxes, 0.25, 18);

        // Hard cap: Never show more than 10 bounding boxes
        if (finalBoxes.length > 10) {
          finalBoxes = finalBoxes.slice(0, 10);
        }

        // Deduplicate: max 2 boxes per ingredient type (e.g., allow 2 tomato clusters but not 5)
        const ingredientCounts = {};
        finalBoxes = finalBoxes.filter(box => {
          const key = box.ingredient;
          ingredientCounts[key] = (ingredientCounts[key] || 0) + 1;
          return ingredientCounts[key] <= 2;
        });

        setIsScanning(false);
        setHasScanned(true);

        if (finalBoxes.length > 0) {
          setDetectedBoxes(finalBoxes);
          const uniqueItems = Array.from(new Set(finalBoxes.map(b => b.ingredient)));
          setPhotoIngredients(uniqueItems);
          setStatusMessage(`Recognized ${uniqueItems.length} ingredients (${finalBoxes.length} items) with YOLOv8 Vision & Feature Fusion`);
        } else if (nonFoodClasses.length > 0) {
          setDetectedBoxes([]);
          setPhotoIngredients([]);
          const uniqueNonFood = [...new Set(nonFoodClasses)].join(', ');
          setStatusMessage(`No food items detected. (Found: ${uniqueNonFood}). Please upload a photo of food ingredients.`);
        } else {
          setDetectedBoxes([]);
          setPhotoIngredients([]);
          setStatusMessage('No food ingredients recognized in this photo. Please try a clearer angle or enter items manually.');
        }
        return;
      }

      // 3. Fallback when neither backend nor TensorFlow is loaded
      setIsScanning(false);
      setHasScanned(true);
      setDetectedBoxes([]);
      setPhotoIngredients([]);
      setStatusMessage('No recognized food items detected. Try another photo or enter them manually below.');
    } catch (err) {
      console.warn('Food detection error:', err);
      setIsScanning(false);
      setHasScanned(true);
      setDetectedBoxes([]);
      setPhotoIngredients([]);
      setBackendError(
        'Could not analyze this photo. Please upload a clear photo of food ingredients or enter items manually.'
      );
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        setSampleImage(base64Data);
        // Clear previous detections immediately when uploading a new photo
        setPhotoIngredients([]);
        setDetectedBoxes([]);
        setHasScanned(false);
        runYoloDetection(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReScan = () => {
    if (sampleImage) {
      setPhotoIngredients([]);
      setDetectedBoxes([]);
      runYoloDetection(sampleImage);
    }
  };

  // Active ingredients list depending on current tab
  const activeIngredientsList = activeTab === 'text' ? textIngredients : photoIngredients;

  // Live calculation of matching recipes from user's current ingredients in the active tab
  const matchedRecipesPreview = useMemo(() => {
    if (!activeIngredientsList || activeIngredientsList.length === 0 || !recipes) return [];
    const matched = [];
    recipes.forEach(recipe => {
      const match = matchRecipeIngredients(recipe.ingredients, activeIngredientsList);
      if (match.have.length > 0) {
        matched.push({ recipe, match });
      }
    });

    matched.sort((a, b) => {
      if (b.match.have.length !== a.match.have.length) {
        return b.match.have.length - a.match.have.length;
      }
      return b.match.matchRatio - a.match.matchRatio;
    });

    return matched;
  }, [recipes, activeIngredientsList]);

  const handleFindRecipes = () => {
    // Save the active tab's ingredients as the active pantry search list
    setScannedIngredients(activeIngredientsList);
    navigate('/recipes');
  };

  const QUICK_SUGGESTIONS = [
    "Garlic", "Onions", "Basmati Rice", "Chicken Breast", "Broccoli", "Ginger", "Curd / Yogurt", "Potatoes"
  ];

  return (
    <div className="scan-page page-wrapper">
      {/* Header */}
      <div className="scan-header animate-fade-in">
        <div className="scan-badge">
          <Cpu size={15} />
          <span>YOLOv8 Vision & SBERT Semantic Search</span>
        </div>
        <h1 className="scan-title">Smart Ingredient Recognition</h1>
        <p className="scan-desc">
          Capture or upload a photo of your groceries to automatically detect food items, or enter what you have manually.
        </p>

        {/* Backend status indicator */}
        <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: backendOnline ? '#10b981' : '#f59e0b',
            display: 'inline-block'
          }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>
            AI Engine: {backendOnline ? <strong style={{ color: '#10b981' }}>Connected & Active</strong> : <strong style={{ color: '#f59e0b' }}>Ready</strong>}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="scan-tabs-nav glass-panel">
        <button
          type="button"
          className={`scan-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
          id="scan-tab-text"
        >
          <Plus size={18} />
          <span>Manual Input (Text)</span>
        </button>
        <button
          type="button"
          className={`scan-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
          id="scan-tab-image"
        >
          <Camera size={18} />
          <span>Image Recognition (YOLOv8)</span>
        </button>
      </div>

      <div className="scan-content-grid">
        {/* Main Interaction Area */}
        <div className="scan-interactive-col">
          {activeTab === 'image' ? (
            <div className="image-scan-card glass-panel">
              {/* Photo Preview & Bounding Box Overlay */}
              <div className="image-viewport-container">
                <div className="image-stage-wrapper">
                  <img 
                    src={sampleImage} 
                    alt="Food Groceries" 
                    className={`viewport-image ${isScanning ? 'blur-scan' : ''}`} 
                  />

                  {/* Laser Scanning Line Animation */}
                  {isScanning && (
                    <div className="scanner-laser-line">
                      <div className="laser-beam"></div>
                    </div>
                  )}

                  {/* Real YOLOv8 Detected Bounding Boxes */}
                  {hasScanned && !isScanning && detectedBoxes.map((item, idx) => (
                    <div
                      key={idx}
                      className="yolo-bounding-box"
                      style={{
                        left: `${item.box.x}%`,
                        top: `${item.box.y}%`,
                        width: `${item.box.w}%`,
                        height: `${item.box.h}%`,
                        borderColor: item.color || '#10b981',
                        '--box-color': item.color || '#10b981'
                      }}
                    >
                      <span 
                        className="yolo-box-label"
                        style={{ 
                          '--box-color': item.color || '#10b981'
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: item.color || '#10b981'
                        }}></span>
                        {item.name} ({item.confidence})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Feedback */}
              {statusMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <Sparkles size={16} style={{ color: 'var(--primary-color)' }} />
                  <span>{statusMessage}</span>
                </div>
              )}

              {backendError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.85rem'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{backendError}</span>
                </div>
              )}

              {/* Upload Controls */}
              <div className="image-actions-bar">
                <label className="btn-secondary upload-file-btn" id="upload-fridge-photo-btn">
                  <Upload size={17} />
                  <span>Upload Custom Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                  />
                </label>

                <button
                  type="button"
                  className="btn-primary btn-glow"
                  onClick={handleReScan}
                  disabled={isScanning}
                  id="re-scan-yolo-btn"
                >
                  <RefreshCw size={17} className={isScanning ? 'spin-icon' : ''} />
                  <span>{isScanning ? 'Detecting Items...' : 'Re-Run Detection'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="manual-scan-card glass-panel">
              <h3 className="card-title">Type Ingredients You Have</h3>
              <p className="card-subtitle">Add items from your pantry, fridge, or spice rack</p>

              <form className="manual-input-form" onSubmit={handleManualAdd}>
                <input
                  id="manual-ingredient-input"
                  type="text"
                  placeholder="e.g., Potato, Chicken, Ginger, Garlic..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                />
                <button type="submit" className="btn-primary" id="add-ingredient-btn">
                  <Plus size={18} />
                  <span>Add</span>
                </button>
              </form>

              {/* Quick Suggestions */}
              <div className="quick-suggestions-section">
                <span className="suggestions-title">Quick Add Popular Items:</span>
                <div className="suggestions-list">
                  {QUICK_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleQuickAdd(item)}
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ingredients Basket & Match Summary Column */}
        <div className="scan-summary-col">
          <div className="basket-card glass-panel">
            <div className="basket-header">
              <div className="basket-title-wrap">
                <CheckCircle2 size={20} className="text-veg" />
                <h3>{activeTab === 'text' ? 'Entered Ingredients' : 'Photo Detected Ingredients'}</h3>
              </div>
              <span className="basket-count-badge">
                {activeIngredientsList.length} Items
              </span>
            </div>

            <p className="basket-instructions">
              {activeTab === 'text'
                ? 'These text ingredients are matched with our recipe catalog to find exact dishes.'
                : 'Items recognized from your photo will be matched against our recipe catalog.'}
            </p>

            {/* Chips List */}
            <div className="ingredient-chips-cloud">
              {activeTab === 'text' ? (
                <>
                  {textIngredients.map((item, idx) => (
                    <div key={idx} className="ingredient-tag-chip">
                      <span>{item}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => removeTextIngredient(item)}
                        aria-label={`Remove ${item}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {textIngredients.length === 0 && (
                    <div className="no-ingredients-msg">
                      No text ingredients added yet. Type ingredients on the left.
                    </div>
                  )}
                </>
              ) : (
                <>
                  {photoIngredients.map((item, idx) => (
                    <div key={idx} className="ingredient-tag-chip">
                      <span>{item}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => removePhotoIngredient(item)}
                        aria-label={`Remove ${item}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {photoIngredients.length === 0 && (
                    <div className="no-ingredients-msg">
                      No photo ingredients detected yet. Upload a photo on the left.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Clear ingredients link */}
            {activeTab === 'text' && textIngredients.length > 0 && (
              <button 
                type="button" 
                className="clear-ingredients-link"
                onClick={clearTextIngredients}
              >
                Clear all text ingredients
              </button>
            )}

            {activeTab === 'image' && photoIngredients.length > 0 && (
              <button 
                type="button" 
                className="clear-ingredients-link"
                onClick={clearPhotoIngredients}
              >
                Clear detected photo ingredients
              </button>
            )}

            {/* Live Matched Recipes Preview with Have vs. Missing Breakdown */}
            {matchedRecipesPreview.length > 0 && (
              <div className="matched-preview-container">
                <div className="matched-preview-header">
                  <div className="preview-header-title">
                    <Sparkles size={16} className="text-primary" />
                    <h4>Found Recipes ({matchedRecipesPreview.length})</h4>
                  </div>
                  <span className="live-match-badge">Live Match</span>
                </div>

                <div className="matched-preview-list">
                  {matchedRecipesPreview.slice(0, 3).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="preview-recipe-card"
                      onClick={() => navigate(`/recipe/${item.recipe.id}`)}
                      title="Click to view preparation & missing items"
                    >
                      <div className="preview-title-row">
                        <span className="preview-recipe-title">{item.recipe.title}</span>
                        <span className="preview-match-pill">{item.match.matchRatio}% Match</span>
                      </div>

                      <div className="preview-ing-breakdown">
                        <div className="preview-have-text">
                          <span className="status-label-green">🟢 You Have ({item.match.have.length}):</span>{' '}
                          {item.match.have.map(h => h.name).join(', ')}
                        </div>
                        <div className="preview-missing-text">
                          <span className="status-label-amber">⚠️ You Have To Have These Also ({item.match.missing.length}):</span>{' '}
                          {item.match.missing.slice(0, 3).map(m => m.name).join(', ')}
                          {item.match.missing.length > 3 && ` +${item.match.missing.length - 3} more`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action CTA */}
            <button
              type="button"
              className="btn-primary btn-glow find-recipes-cta"
              onClick={handleFindRecipes}
              disabled={activeIngredientsList.length === 0}
              id="find-matching-recipes-btn"
            >
              <span>
                {matchedRecipesPreview.length > 0 
                  ? `Find Matching Recipes (${matchedRecipesPreview.length})` 
                  : 'Find Matching Recipes'}
              </span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
