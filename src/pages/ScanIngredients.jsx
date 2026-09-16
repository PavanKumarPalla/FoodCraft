// src/pages/ScanIngredients.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, Plus, X, CheckCircle2, 
  Cpu, ArrowRight, RefreshCw
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import { MOCK_DETECTED_INGREDIENTS } from '../data/mockData';
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
  const [hasScanned, setHasScanned] = useState(true);
  const [sampleImage, setSampleImage] = useState(
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1000&q=80'
  );

  const navigate = useNavigate();

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      addScannedIngredient(manualInput.trim());
      setManualInput('');
    }
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
      // Auto populate detected items
      MOCK_DETECTED_INGREDIENTS.forEach(item => {
        addScannedIngredient(item.name);
      });
    }, 1200);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSampleImage(url);
      handleSimulateScan();
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
          Capture a photo of your fridge or pantry to automatically detect food items, or enter what you have manually.
        </p>
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

                {/* YOLOv8 Detected Bounding Boxes */}
                {hasScanned && !isScanning && MOCK_DETECTED_INGREDIENTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="yolo-bounding-box"
                    style={{
                      left: `${item.box.x}%`,
                      top: `${item.box.y}%`,
                      width: `${item.box.w}%`,
                      height: `${item.box.h}%`,
                      borderColor: item.color
                    }}
                  >
                    <span 
                      className="yolo-box-label"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name} ({item.confidence})
                    </span>
                  </div>
                ))}
              </div>

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
                  onClick={handleSimulateScan}
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
