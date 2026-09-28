// src/pages/ScanIngredients.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, Plus, X, CheckCircle2, 
  Cpu, ArrowRight, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './ScanIngredients.css';

export default function ScanIngredients() {
  const { 
    scannedIngredients, 
    addScannedIngredient, 
    removeScannedIngredient, 
    resetScannedIngredients 
  } = useFoodCraft();

  const [activeTab, setActiveTab] = useState('image'); // 'image' | 'text'
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

  const checkBackendHealth = async () => {
    try {
      let res;
      try {
        res = await fetch('/api/recipes/health');
      } catch {
        res = await fetch('http://localhost:8000/api/recipes/health');
      }
      if (res && res.ok) {
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
      addScannedIngredient(manualInput.trim());
      setManualInput('');
    }
  };

  // Real YOLOv8 AI inference call
  const runYoloDetection = async (base64Image) => {
    setIsScanning(true);
    setBackendError(null);
    setStatusMessage('Analyzing photo with YOLOv8 food detection model...');

    try {
      let res;
      const payload = { image: base64Image, confidence: 0.25 };

      try {
        res = await fetch('/api/detect-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        // Fallback to direct localhost:8000
        res = await fetch('http://localhost:8000/api/detect-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        throw new Error(`AI Backend returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setIsScanning(false);
      setHasScanned(true);
      setBackendOnline(true);

      if (data.detected_ingredients && data.detected_ingredients.length > 0) {
        setDetectedBoxes(data.detected_ingredients);
        
        // Populate the detected ingredients basket
        data.unique_ingredients.forEach(item => {
          addScannedIngredient(item);
        });

        setStatusMessage(`Recognized ${data.count} ingredient${data.count > 1 ? 's' : ''} with ${data.model}`);
      } else {
        setDetectedBoxes([]);
        setStatusMessage('No recognized food items detected. Try another photo or add manually below.');
      }
    } catch (err) {
      console.warn('Real-time YOLOv8 backend error:', err);
      setIsScanning(false);
      setHasScanned(true);
      setDetectedBoxes([]);
      setBackendOnline(false);
      setBackendError(
        'FastAPI AI Backend is offline. Start it with "python backend/run.py" to enable live YOLOv8 computer vision detection.'
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
        runYoloDetection(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReScan = () => {
    if (sampleImage) {
      runYoloDetection(sampleImage);
    }
  };

  const handleFindRecipes = () => {
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
            AI Backend: {backendOnline ? <strong style={{ color: '#10b981' }}>Online (FastAPI :8000)</strong> : <strong style={{ color: '#f59e0b' }}>Waiting for "python backend/run.py"</strong>}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="scan-tabs-nav glass-panel">
        <button
          type="button"
          className={`scan-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
          id="scan-tab-image"
        >
          <Camera size={18} />
          <span>Image Recognition (YOLOv8)</span>
        </button>
        <button
          type="button"
          className={`scan-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
          id="scan-tab-text"
        >
          <Plus size={18} />
          <span>Manual Input (Text)</span>
        </button>
      </div>

      <div className="scan-content-grid">
        {/* Main Interaction Area */}
        <div className="scan-interactive-col">
          {activeTab === 'image' ? (
            <div className="image-scan-card glass-panel">
              {/* Photo Preview & Bounding Box Overlay */}
              <div className="image-viewport-container">
                <img 
                  src={sampleImage} 
                  alt="Fridge Groceries" 
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
                      borderColor: item.color || '#10b981'
                    }}
                  >
                    <span 
                      className="yolo-box-label"
                      style={{ backgroundColor: item.color || '#10b981' }}
                    >
                      {item.name} ({item.confidence})
                    </span>
                  </div>
                ))}
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
                  <span>{isScanning ? 'Detecting Items...' : 'Re-Run YOLOv8 Detection'}</span>
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
                  placeholder="e.g., Paneer, Chicken, Garlic, Quinoa..."
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
                      onClick={() => addScannedIngredient(item)}
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ingredients Basket & Match Summary */}
        <div className="scan-summary-col">
          <div className="basket-card glass-panel">
            <div className="basket-header">
              <div className="basket-title-wrap">
                <CheckCircle2 size={20} className="text-veg" />
                <h3>Detected Ingredients</h3>
              </div>
              <span className="basket-count-badge">{scannedIngredients.length} Items</span>
            </div>

            <p className="basket-instructions">
              These items will be matched against 2.2M+ recipes using Sentence-BERT embeddings.
            </p>

            {/* Chips List */}
            <div className="ingredient-chips-cloud">
              {scannedIngredients.map((item, idx) => (
                <div key={idx} className="ingredient-tag-chip">
                  <span>{item}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => removeScannedIngredient(item)}
                    aria-label={`Remove ${item}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {scannedIngredients.length === 0 && (
                <div className="no-ingredients-msg">
                  No ingredients selected yet. Upload a photo or type ingredients above.
                </div>
              )}
            </div>

            {/* Clear all link */}
            {scannedIngredients.length > 0 && (
              <button 
                type="button" 
                className="clear-ingredients-link"
                onClick={resetScannedIngredients}
              >
                Clear all ingredients
              </button>
            )}

            {/* Model Architecture Note */}
            <div className="model-info-box">
              <div className="model-info-header">
                <Cpu size={15} className="text-primary" />
                <span>Search Algorithm</span>
              </div>
              <p>
                <strong>RecipeNLG + FAISS</strong> calculates cosine distance between detected ingredient embeddings and 2.2M catalog recipes with instant response.
              </p>
            </div>

            {/* Action CTA */}
            <button
              type="button"
              className="btn-primary btn-glow find-recipes-cta"
              onClick={handleFindRecipes}
              disabled={scannedIngredients.length === 0}
              id="find-matching-recipes-btn"
            >
              <span>Find Matching Recipes</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
