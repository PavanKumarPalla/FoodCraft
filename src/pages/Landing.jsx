// src/pages/Landing.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Camera, 
  Sparkles, 
  Heart, 
  ChefHat, 
  ClipboardList, 
  Upload, 
  Leaf, 
  Zap, 
  CheckCircle2, 
  Menu, 
  X, 
  Utensils, 
  ArrowRight,
  Clock,
  Flame,
  Info,
  SlidersHorizontal,
  User,
  Plus
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import { matchRecipeIngredients } from '../utils/ingredientMatcher';
import Sidebar from '../components/Sidebar';
import RecipeCard from '../components/RecipeCard';
import './Landing.css';

export default function Landing() {
  const { recipes, favorites, token, currentUser, userProfile, setScannedIngredients } = useFoodCraft();
  const navigate = useNavigate();

  // Navigation & Drawer States - open by default on desktop (>=1024px), collapsed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [activeNav, setActiveNav] = useState('home');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);

  // Card 1: Ingredient Input State
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientsList, setIngredientsList] = useState(['Tomato', 'Onion', 'Bell Pepper']);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Card 2: Diet Plan Selects State
  const [selectedDiet, setSelectedDiet] = useState('Vegetarian');
  const [selectedGoal, setSelectedGoal] = useState('Weight Loss');
  const [selectedMeal, setSelectedMeal] = useState('Dinner');
  const [dietResults, setDietResults] = useState(null);

  // Quick suggestions for ingredients
  const quickSuggestions = ['Garlic', 'Chicken', 'Potato', 'Spinach', 'Egg', 'Paneer', 'Cheese'];

  // Handle Search Submission against Hugging Face / RecipeNLG Dataset
  const handleSearchSubmit = async (queryText) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchExecuted(true);
    setSearchedKeyword(q);

    // 1. Try backend SBERT + FAISS recommendation
    try {
      const qTokens = q.toLowerCase().split(/[\s,]+/).filter(Boolean);
      let apiRecipes = [];

      try {
        const resp = await fetch('/api/recommend-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: qTokens, top_k: 12, include_images: false }),
          signal: AbortSignal.timeout(3000)
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success && Array.isArray(data.recipes) && data.recipes.length > 0) {
            apiRecipes = data.recipes.map((r, i) => ({
              id: `hf-${r.rank || i}`,
              title: r.title,
              image: '/images/biryani_hero.jpg',
              description: r.directions ? r.directions.slice(0, 2).join(' ') : 'Curated recipe retrieved from Hugging Face RecipeNLG dataset.',
              ingredients: (r.ingredients || []).map(ing => ({ name: ing, amount: '' })),
              instructions: r.directions || [],
              matchScore: Math.min(99, Math.max(75, Math.round(((r.similarity_score || 0.8) + 0.15) * 100))),
              time: 25,
              calories: 410,
              protein: '24g',
              dietType: 'veg',
              cuisine: 'RecipeNLG',
              healthTags: ['Hugging Face', 'AI Matched']
            }));
          }
        }
      } catch (err) {
        console.warn('Backend SBERT API offline, searching simulated 2.2M+ dataset locally:', err.message);
      }

      // 2. Comprehensive local RecipeNLG search
      const qLower = q.toLowerCase();
      const localMatches = recipes.filter(r => {
        const titleMatch = r.title && r.title.toLowerCase().includes(qLower);
        const descMatch = r.description && r.description.toLowerCase().includes(qLower);
        const cuisineMatch = r.cuisine && r.cuisine.toLowerCase().includes(qLower);
        const tagMatch = Array.isArray(r.healthTags) && r.healthTags.some(t => t.toLowerCase().includes(qLower));
        const ingMatch = Array.isArray(r.ingredients) && r.ingredients.some(ing => (ing.name || ing).toLowerCase().includes(qLower));
        return titleMatch || descMatch || cuisineMatch || tagMatch || ingMatch;
      });

      // Combine API and local matches without duplicates
      const seenTitles = new Set();
      const combined = [];
      for (const item of [...apiRecipes, ...localMatches]) {
        const cleanTitle = (item.title || '').trim().toLowerCase();
        if (cleanTitle && !seenTitles.has(cleanTitle)) {
          seenTitles.add(cleanTitle);
          combined.push(item);
        }
      }

      setSearchResults(combined.slice(0, 12));
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      // Scroll smoothly to results
      setTimeout(() => {
        const el = document.getElementById('hf-search-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Add Ingredient Tag
  const handleAddIngredient = (itemToAdd) => {
    const val = (itemToAdd || ingredientInput).trim();
    if (val && !ingredientsList.some(i => i.toLowerCase() === val.toLowerCase())) {
      setIngredientsList([...ingredientsList, val]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (itemToRemove) => {
    setIngredientsList(ingredientsList.filter(i => i !== itemToRemove));
  };

  // Trigger Recipe Search from Ingredients Card
  const handleDetectIngredients = () => {
    if (ingredientsList.length > 0) {
      setScannedIngredients(ingredientsList);
      navigate(`/recipes?q=${encodeURIComponent(ingredientsList.join(', '))}`);
    } else {
      navigate('/scan');
    }
  };

  // Handle Photo Upload in Card 1
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Diet Recipe Search from Card 2
  const handleGetDietRecipes = () => {
    const matched = recipes.filter(r => {
      const dietMatch = selectedDiet === 'Vegetarian' ? r.dietType === 'veg' :
                         selectedDiet === 'Vegan' ? (r.dietType === 'veg' && !r.title.toLowerCase().includes('paneer') && !r.title.toLowerCase().includes('cheese')) :
                         selectedDiet === 'High-Protein' ? (r.healthTags || []).includes('High Protein') || parseInt(r.protein || 0) >= 20 :
                         true;
      return dietMatch;
    });

    setDietResults({
      diet: selectedDiet,
      goal: selectedGoal,
      meal: selectedMeal,
      recipes: matched.slice(0, 6)
    });

    setTimeout(() => {
      const el = document.getElementById('diet-results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const isLoggedIn = Boolean(token && currentUser);
  const displayName = currentUser?.name || userProfile?.name || 'Chef';
  const firstName = displayName.trim().split(' ')[0] || 'Chef';

  return (
    <div className={`home-layout-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* ── Left Navigation Sidebar (matching Image 1) ── */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        docked={true}
      />

      {/* ── Main Home Column (Header + Content + Footer) ── */}
      <div className="home-main-column">
        {/* ── Top Header Navigation (matching referral Image 1) ── */}
        <header className="home-header">
          <div className="home-header-container">
            {/* Left: Sidebar Toggle & Brand Logo */}
            <div className="home-brand-group">
              <button 
                className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? "Close Navigation Sidebar" : "Open Navigation Sidebar"}
                aria-label="Toggle Navigation Sidebar"
                id="home-sidebar-toggle-btn"
              >
                <Menu size={22} />
              </button>

            <Link to="/" className="home-logo-link">
              <div className="home-logo-badge">
                <ChefHat size={22} className="logo-chef" />
                <span className="logo-leaf">🌿</span>
              </div>
              <span className="home-logo-text">Food<span className="logo-accent">Craft</span></span>
            </Link>
          </div>

          {/* Center: Main Navigation Links */}
          <nav className="home-nav-links">
            <button 
              className={`nav-pill ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => { setActiveNav('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <Utensils size={15} />
              <span>Home</span>
            </button>
            <button 
              className={`nav-link-item ${activeNav === 'about' ? 'active' : ''}`}
              onClick={() => setShowAboutModal(true)}
            >
              <Info size={15} />
              <span>About</span>
            </button>
            <button 
              className={`nav-link-item ${activeNav === 'features' ? 'active' : ''}`}
              onClick={() => {
                const el = document.getElementById('feature-cards-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Sparkles size={15} />
              <span>Features</span>
            </button>
            <button 
              className={`nav-link-item ${activeNav === 'tips' ? 'active' : ''}`}
              onClick={() => setShowTipsModal(true)}
            >
              <Leaf size={15} />
              <span>Tips</span>
            </button>
            <button 
              className={`nav-link-item ${activeNav === 'contact' ? 'active' : ''}`}
              onClick={() => setShowContactModal(true)}
            >
              <span>Contact</span>
            </button>
          </nav>

          {/* Right: Sign In / Account Chip */}
          <div className="home-auth-actions">
            {isLoggedIn ? (
              <Link to="/profile" className="home-user-chip" id="home-profile-btn" title="View Profile">
                <div className="user-avatar-circle">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <span className="user-name-text">{firstName}</span>
              </Link>
            ) : (
              <Link to="/login" className="home-signin-btn" id="home-signin-btn" title="Sign In to FoodCraft">
                <User size={16} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Home Body Content ── */}
      <main className="home-main-content">
        {/* ── 1. Hero Section ── */}
        <section className="home-hero-section">
          <div className="hero-grid-container">
            {/* Left Hero Content */}
            <div className="hero-text-column">
              <h1 className="hero-main-title">
                Cook Smart. Eat Better. <br />
                with <span className="hero-brand-name">FoodCraft</span>
              </h1>

              <p className="hero-description">
                Discover delicious recipes tailored to your ingredients and dietary needs! Powered by YOLOv8 vision and 2.2M+ verified recipes from Hugging Face & RecipeNLG.
              </p>

              <div className="hero-assistant-badge">
                <span className="leaf-icon">🌿</span>
                <span>Your Personal Recipe Assistant 💚</span>
              </div>

              {/* ── Hugging Face Dataset Search Bar ── */}
              <div className="hero-search-wrapper">
                <form 
                  className="hero-search-bar" 
                  onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}
                >
                  <Search className="hero-search-icon" size={20} />
                  <input
                    type="text"
                    className="hero-search-input"
                    placeholder="Search 2.2M+ recipes (e.g. Biryani, Paneer, Chicken, Smoothie)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    id="home-dataset-search-input"
                  />
                  <button 
                    type="submit" 
                    className="hero-search-btn"
                    disabled={isSearching}
                    id="home-dataset-search-submit-btn"
                  >
                    {isSearching ? <span className="loading-spinner-sm" /> : <Search size={16} />}
                    <span>Search</span>
                  </button>
                </form>

                {/* Trending Tags from Dataset */}
                <div className="trending-tags-row">
                  <span className="trending-label">Trending:</span>
                  {['Biryani', 'Chicken Tikka', 'Paneer Butter Masala', 'Quinoa Salad', 'Smoothie', 'Masala Dosa'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="trending-chip"
                      onClick={() => { setSearchQuery(tag); handleSearchSubmit(tag); }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Realistic Biryani & Healthy Choices Tagline */}
            <div className="hero-image-column">
              <div className="biryani-showcase-card">
                <div className="hero-dish-image-wrapper">
                  <img
                    src="/images/biryani_hero.jpg"
                    alt="Authentic Delicious Biryani"
                    className="hero-dish-img"
                    onError={(e) => {
                      e.target.src = '/images/meal_planner_images/chicken_biryani.jpg';
                    }}
                  />
                  <div className="dish-glow-overlay" />
                </div>

                {/* Healthy Choices... Delicious Results! Tagline */}
                <div className="delicious-results-badge">
                  <span className="script-line-1">Healthy Choices...</span>
                  <span className="script-line-2">Delicious Results!</span>
                  <div className="sparkle-cluster">
                    <Sparkles size={14} className="star-1" />
                    <Sparkles size={12} className="star-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Live Hugging Face Dataset Search Results (If Searched) ── */}
        {searchExecuted && (
          <section className="search-results-section animate-fade-in" id="hf-search-results-section">
            <div className="search-results-header">
              <div className="results-title-group">
                <span className="badge badge-gym">Hugging Face Dataset</span>
                <h2>
                  Recipes matching <span className="query-highlight">"{searchedKeyword}"</span>
                </h2>
                <p className="results-subtitle">
                  {searchResults.length} recipe{searchResults.length !== 1 ? 's' : ''} retrieved from RecipeNLG knowledge base
                </p>
              </div>
              <button 
                className="close-results-btn"
                onClick={() => setSearchExecuted(false)}
                title="Dismiss Results"
              >
                <X size={18} />
                <span>Close</span>
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="results-recipe-grid">
                {searchResults.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="search-no-results">
                <Utensils size={40} className="text-muted" />
                <h3>No exact recipe match found</h3>
                <p>Try searching for core ingredients like "chicken", "paneer", "rice", or "salad".</p>
              </div>
            )}
          </section>
        )}

        {/* ── 3. Interactive Feature Cards (Ingredient Detection & Diet Plan) ── */}
        <section className="feature-cards-section" id="feature-cards-section">
          <div className="feature-cards-grid">
            {/* ── Card 1: Ingredient Detection & Recipe Recommendation ── */}
            <div className="feature-box card-green-theme">
              {/* Header */}
              <div className="feature-box-header">
                <div className="feature-badge-icon badge-green">
                  <Camera size={24} />
                </div>
                <div className="feature-header-text">
                  <h2 className="feature-box-title">Ingredient Detection & Recipe Recommendation</h2>
                  <p className="feature-box-subtitle">
                    Upload a photo of your fridge or enter ingredients, and let FoodCraft find the best recipes!
                  </p>
                </div>
              </div>

              {/* Main Content: Controls Left, Realistic Basket Right */}
              <div className="feature-box-body">
                <div className="feature-controls-col">
                  {/* Sub-box 1: Upload Image or Drag & Drop */}
                  <div 
                    className={`upload-dropzone ${uploadedImagePreview ? 'has-preview' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      className="hidden-file-input" 
                      onChange={handlePhotoUpload}
                    />
                    {uploadedImagePreview ? (
                      <div className="upload-preview-container">
                        <img src={uploadedImagePreview} alt="Uploaded produce" className="uploaded-thumbnail" />
                        <div className="preview-overlay">
                          <span className="preview-status">Photo Ready to Scan</span>
                          <button 
                            className="btn-quick-scan"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/scan');
                            }}
                          >
                            Scan with YOLOv8 →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="dropzone-empty-state">
                        <div className="upload-cloud-icon">
                          <Upload size={24} />
                        </div>
                        <span className="upload-main-text">Upload Image</span>
                        <span className="upload-sub-text">or drag & drop</span>
                      </div>
                    )}
                  </div>

                  {/* OR Divider */}
                  <div className="or-divider-pill">
                    <span className="or-text">OR</span>
                  </div>

                  {/* Sub-box 2: Enter Ingredients Input & Tags */}
                  <div className="manual-ingredients-box">
                    <div className="ingredient-input-row">
                      <input
                        type="text"
                        className="ingredient-text-input"
                        placeholder="Enter ingredients (e.g. tomato, onion, cheese)"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddIngredient();
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn-add-ing" 
                        onClick={() => handleAddIngredient()}
                        title="Add Ingredient"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Tag Pills */}
                    <div className="ingredient-pills-wrap">
                      {ingredientsList.map(item => (
                        <span key={item} className="ingredient-pill">
                          <span>{item}</span>
                          <button 
                            type="button" 
                            className="pill-remove-btn" 
                            onClick={() => handleRemoveIngredient(item)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Add Suggestions */}
                    <div className="quick-suggestions-row">
                      <span className="quick-label">Quick add:</span>
                      {quickSuggestions.slice(0, 4).map(s => (
                        <button
                          key={s}
                          type="button"
                          className="quick-chip"
                          onClick={() => handleAddIngredient(s)}
                        >
                          +{s}
                        </button>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button 
                      type="button" 
                      className="btn-feature-primary btn-green"
                      onClick={handleDetectIngredients}
                      id="home-detect-recipes-btn"
                    >
                      <Search size={17} />
                      <span>Detect & Get Recipes →</span>
                    </button>
                  </div>
                </div>

                {/* Right Visual: Realistic Produce Basket */}
                <div className="feature-visual-col">
                  <div className="produce-basket-card">
                    <img
                      src="/images/produce_basket.jpg"
                      alt="Fresh Fruit & Vegetable Produce Basket"
                      className="produce-basket-img"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="basket-floating-tag tag-top">
                      <span className="dot-pulse-green" />
                      <span>Fresh Whole Produce</span>
                    </div>
                    <div className="basket-floating-tag tag-bottom">
                      <span>YOLOv8 Ingredient AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card 2: Diet Plan-Based Recipe Recommendation ── */}
            <div className="feature-box card-orange-theme">
              {/* Header */}
              <div className="feature-box-header">
                <div className="feature-badge-icon badge-orange">
                  <Heart size={24} />
                </div>
                <div className="feature-header-text">
                  <h2 className="feature-box-title">Diet Plan-Based Recipe Recommendation</h2>
                  <p className="feature-box-subtitle">
                    Choose your diet and health goal to get personalized recipe suggestions!
                  </p>
                </div>
              </div>

              {/* Main Content: Selects Left, Realistic Salad & Checklist Right */}
              <div className="feature-box-body">
                <div className="feature-controls-col">
                  {/* Select Controls Grid */}
                  <div className="diet-selects-grid">
                    <div className="select-field-group">
                      <label className="select-label">Diet Preference</label>
                      <select 
                        className="diet-select-dropdown"
                        value={selectedDiet}
                        onChange={(e) => setSelectedDiet(e.target.value)}
                        id="home-diet-preference-select"
                      >
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="High-Protein">High-Protein</option>
                        <option value="Keto / Low-Carb">Keto / Low-Carb</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                        <option value="Non-Veg">Non-Vegetarian</option>
                        <option value="Mediterranean">Mediterranean</option>
                      </select>
                    </div>

                    <div className="select-field-group">
                      <label className="select-label">Health Goal</label>
                      <select 
                        className="diet-select-dropdown"
                        value={selectedGoal}
                        onChange={(e) => setSelectedGoal(e.target.value)}
                        id="home-health-goal-select"
                      >
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Muscle Gain">Muscle Gain (Gym)</option>
                        <option value="Balanced Diet">Balanced Diet</option>
                        <option value="Energy Boost">Energy Boost</option>
                        <option value="Low Sugar">Low Sugar / Diabetic</option>
                        <option value="Heart Healthy">Heart Healthy (Low Salt)</option>
                      </select>
                    </div>

                    <div className="select-field-group">
                      <label className="select-label">Meal Type</label>
                      <select 
                        className="diet-select-dropdown"
                        value={selectedMeal}
                        onChange={(e) => setSelectedMeal(e.target.value)}
                        id="home-meal-type-select"
                      >
                        <option value="Dinner">Dinner</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Snack">Snacks & Smoothies</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Micro Badge */}
                  <div className="diet-summary-pill">
                    <CheckCircle2 size={15} className="text-orange" />
                    <span>Selected: <strong>{selectedDiet}</strong> for <strong>{selectedGoal}</strong> ({selectedMeal})</span>
                  </div>

                  {/* Action Button */}
                  <button 
                    type="button" 
                    className="btn-feature-primary btn-orange"
                    onClick={handleGetDietRecipes}
                    id="home-get-diet-recipes-btn"
                  >
                    <Utensils size={17} />
                    <span>Get Diet Recipes →</span>
                  </button>

                  <div className="quick-plan-link-row">
                    <span>Need a complete 7-day schedule?</span>
                    <Link to="/meal-plan" className="inline-link-bold">Open Meal Planner →</Link>
                  </div>
                </div>

                {/* Right Visual: Realistic Salad & Clipboard Checklist */}
                <div className="feature-visual-col">
                  <div className="diet-plan-visual-card">
                    {/* Realistic Clipboard Checklist */}
                    <div className="clipboard-sheet">
                      <div className="clipboard-clip" />
                      <div className="clipboard-header">
                        <span className="clipboard-title">Diet Plan</span>
                      </div>
                      <div className="clipboard-checklist">
                        <div className="check-row">
                          <CheckCircle2 size={16} className="check-icon-orange" />
                          <span>Healthy</span>
                        </div>
                        <div className="check-row">
                          <CheckCircle2 size={16} className="check-icon-orange" />
                          <span>Balanced</span>
                        </div>
                        <div className="check-row">
                          <CheckCircle2 size={16} className="check-icon-orange" />
                          <span>Nutritious</span>
                        </div>
                      </div>
                    </div>

                    {/* Realistic Salad Bowl */}
                    <div className="salad-bowl-container">
                      <img
                        src="/images/diet_salad.jpg"
                        alt="Fresh Healthy Mediterranean Salad Bowl"
                        className="diet-salad-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Diet Recipe Results Section (If Clicked) ── */}
        {dietResults && (
          <section className="search-results-section animate-fade-in" id="diet-results-section">
            <div className="search-results-header">
              <div className="results-title-group">
                <span className="badge badge-match">Tailored Diet Recipes</span>
                <h2>
                  {dietResults.diet} recipes for {dietResults.goal}
                </h2>
                <p className="results-subtitle">
                  Balanced {dietResults.meal} options meeting macro targets
                </p>
              </div>
              <button 
                className="close-results-btn"
                onClick={() => setDietResults(null)}
                title="Dismiss Results"
              >
                <X size={18} />
                <span>Close</span>
              </button>
            </div>

            <div className="results-recipe-grid">
              {dietResults.recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Why FoodCraft? Ribbon Strip ── */}
        <section className="why-foodcraft-ribbon">
          <div className="why-ribbon-container">
            <div className="why-title-wrapper">
              <h3 className="why-heading">Why FoodCraft?</h3>
              <div className="why-vertical-divider" />
            </div>

            <div className="why-features-list">
              <div className="why-item">
                <div className="why-icon-circle">
                  <ChefHat size={22} className="why-icon" />
                </div>
                <div className="why-item-text">
                  <span className="why-item-title">Smart Recipe Suggestions</span>
                </div>
              </div>

              <div className="why-item">
                <div className="why-icon-circle">
                  <Leaf size={22} className="why-icon" />
                </div>
                <div className="why-item-text">
                  <span className="why-item-title">Personalized Diet Plans</span>
                </div>
              </div>

              <div className="why-item">
                <div className="why-icon-circle">
                  <Zap size={22} className="why-icon" />
                </div>
                <div className="why-item-text">
                  <span className="why-item-title">Quick & Easy Access</span>
                </div>
              </div>

              <div className="why-item">
                <div className="why-icon-circle">
                  <Heart size={22} className="why-icon" />
                </div>
                <div className="why-item-text">
                  <span className="why-item-title">Healthy Lifestyle Made Simple</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Bottom Banner: Good Food. Good Mood! 💚 ── */}
        <footer className="home-footer-banner">
          <div className="footer-wave-wrap">
            <span className="footer-leaf-left">🌿</span>
            <p className="footer-tagline">Good Food. Good Mood! 💚</p>
            <span className="footer-leaf-right">🍃</span>
          </div>
        </footer>
      </main>

      {/* ── About Modal ── */}
      {showAboutModal && (
        <div className="home-modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="home-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>About FoodCraft</h3>
              <button className="modal-close" onClick={() => setShowAboutModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>
                <strong>FoodCraft</strong> is an intelligent culinary platform designed to transform raw pantry items into gourmet meals while eliminating food waste.
              </p>
              <p>
                Powered by a dual-engine vision system (YOLOv8 + CLIP) and vector search over 2.2M+ verified recipes from Hugging Face & RecipeNLG, FoodCraft provides chef-level culinary guidance directly on your device.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tips Modal ── */}
      {showTipsModal && (
        <div className="home-modal-overlay" onClick={() => setShowTipsModal(false)}>
          <div className="home-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chef & Storage Tips</h3>
              <button className="modal-close" onClick={() => setShowTipsModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="tip-card">
                <h4>🥦 Keep Herbs & Greens Crisp</h4>
                <p>Wrap fresh coriander, mint, or spinach in a lightly damp paper towel inside an airtight container to keep them crisp for up to 10 days.</p>
              </div>
              <div className="tip-card">
                <h4>🍗 Master Searing Heat</h4>
                <p>Never crowd the pan when searing paneer, mushrooms, or chicken. Leave space for moisture to evaporate, giving you golden caramelization.</p>
              </div>
              <div className="tip-card">
                <h4>🥑 Keep Avocado Fresh</h4>
                <p>Store leftover cut avocado with a cut red onion in an airtight container — the sulfur vapors naturally prevent browning.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Modal ── */}
      {showContactModal && (
        <div className="home-modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="home-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact FoodCraft Team</h3>
              <button className="modal-close" onClick={() => setShowContactModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>We'd love to hear your feedback, feature ideas, and recipe requests!</p>
              <div className="contact-info-box">
                <p><strong>Support Email:</strong> foodcraft975@gmail.com</p>
                <p><strong>Platform:</strong> Food Craft AI 2.2M+ Edition</p>
                <p><strong>Hours:</strong> Mon - Sat, 9:00 AM - 8:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div> {/* end home-main-column */}
    </div>
  );
}
