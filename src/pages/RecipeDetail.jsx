// src/pages/RecipeDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Clock, Users, Flame, Dumbbell, 
  Check, Calendar, Sparkles, ChefHat, AlertTriangle, CheckCircle2, ShoppingBag
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import { matchRecipeIngredients } from '../utils/ingredientMatcher';
import './RecipeDetail.css';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, isFavorite, toggleFavorite, setMealPlan, scannedIngredients } = useFoodCraft();

  const recipe = recipes.find(r => r.id === id) || recipes[0];
  const favorite = isFavorite(recipe.id);

  // Match ingredients against user's scanned/entered items
  const matchData = matchRecipeIngredients(recipe.ingredients, scannedIngredients);

  // Step completion state
  const [completedSteps, setCompletedSteps] = useState({});
  const [showPlanSuccess, setShowPlanSuccess] = useState(false);


  const toggleStep = (idx) => {
    setCompletedSteps(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleAddToPlan = () => {
    setMealPlan(prev => {
      const updated = [...prev];
      if (updated[0]) {
        updated[0] = {
          ...updated[0],
          meals: {
            ...updated[0].meals,
            [recipe.mealType.toLowerCase() === 'breakfast' ? 'breakfast' : 
             recipe.mealType.toLowerCase() === 'snacks' ? 'snacks' : 
             recipe.mealType.toLowerCase() === 'lunch' ? 'lunch' : 'dinner']: recipe
          }
        };
      }
      return updated;
    });

    setShowPlanSuccess(true);
    setTimeout(() => setShowPlanSuccess(false), 2500);
  };

  return (
    <div className="detail-page page-wrapper">
      {/* Top Floating Back & Actions */}
      <div className="detail-top-nav">
        <button 
          type="button" 
          className="back-circle-btn" 
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="top-nav-right">
          <button 
            type="button"
            className={`detail-fav-btn ${favorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(recipe.id)}
            aria-label={favorite ? "Remove favorite" : "Add to favorites"}
            id="detail-favorite-btn"
          >
            <Heart size={20} fill={favorite ? "#ef4444" : "none"} color={favorite ? "#ef4444" : "#ffffff"} />
          </button>
        </div>
      </div>

      {/* Header Info Card — Text-First, NO default/stock images as requested */}
      <header className="detail-header-card glass-panel">
        <div className="detail-cuisine-row">
          <span className={`badge badge-${recipe.dietType}`}>
            {recipe.dietType === 'veg' ? '🟢 Veg' : recipe.dietType === 'non-veg' ? '🔴 Non-Veg' : '🥚 Egg'}
          </span>
          <span className="dot-sep">•</span>
          <span className="detail-cuisine-badge">{recipe.cuisine}</span>
          <span className="dot-sep">•</span>
          <span className="detail-meal-badge">{recipe.mealType}</span>
          <span className="dot-sep">•</span>
          <span className="detail-diff-badge">{recipe.difficulty} Prep</span>
          {matchData.have.length > 0 && (
            <>
              <span className="dot-sep">•</span>
              <span className="badge badge-match">
                <Sparkles size={12} />
                <span>{matchData.matchRatio}% Pantry Match</span>
              </span>
            </>
          )}
        </div>

        <h1 className="detail-title">{recipe.title}</h1>
        {recipe.description && (
          <p className="detail-desc">{recipe.description}</p>
        )}

        {/* Health & Diet Tags */}
        {recipe.healthTags && recipe.healthTags.length > 0 && (
          <div className="detail-tags-row">
            {recipe.healthTags.map((tag, idx) => (
              <span key={idx} className="detail-tag-pill">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="detail-metrics-grid">
          <div className="detail-metric-card">
            <Clock size={18} className="metric-icon" />
            <span className="metric-val">{recipe.time} mins</span>
            <span className="metric-sub">Total Time</span>
          </div>
          <div className="detail-metric-card">
            <Flame size={18} className="metric-icon text-flame" />
            <span className="metric-val">{recipe.calories} kcal</span>
            <span className="metric-sub">Calories</span>
          </div>
          <div className="detail-metric-card">
            <Dumbbell size={18} className="metric-icon text-protein" />
            <span className="metric-val">{recipe.protein}</span>
            <span className="metric-sub">Protein</span>
          </div>
          <div className="detail-metric-card">
            <Users size={18} className="metric-icon" />
            <span className="metric-val">{recipe.servings} Portions</span>
            <span className="metric-sub">Servings</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: INGREDIENTS BREAKDOWN (FIRST SECTION - SHOW MISSING ITEMS FIRST) */}
      {/* ========================================================================= */}
      <section className="ingredients-section-flow">
        {/* Prominent Missing Ingredients Alert Box */}
        <div className="missing-ingredients-highlight-box glass-panel">
          <div className="missing-box-header">
            <div className="missing-header-title-wrap">
              <div className="alert-circle-icon-wrap">
                <AlertTriangle size={24} className="text-warning" />
              </div>
              <div>
                <h2 className="missing-box-title">
                  Missing Ingredients — You Have To Have These Ingredients Also
                </h2>
                <p className="missing-box-subtitle">
                  {scannedIngredients.length > 0
                    ? `You have ${matchData.have.length} of ${matchData.total} items. To prepare ${recipe.title}, you also need the following ${matchData.missing.length} ingredients:`
                    : `This recipe requires ${matchData.total} ingredients. Here is what you need to have:`}
                </p>
              </div>
            </div>
            <span className="missing-count-badge">
              <ShoppingBag size={14} />
              <span>{matchData.missing.length} To Procure</span>
            </span>
          </div>

          <div className="missing-items-grid">
            {matchData.missing.length > 0 ? (
              matchData.missing.map((item, idx) => (
                <div key={idx} className="missing-item-card">
                  <div className="missing-item-indicator">
                    <span className="missing-dot"></span>
                  </div>
                  <div className="missing-item-info">
                    <span className="missing-item-name">{item.name}</span>
                    {item.amount && <span className="missing-item-amount">{item.amount}</span>}
                  </div>
                  <span className="need-have-tag">Need To Have</span>
                </div>
              ))
            ) : (
              <div className="all-ingredients-ready-box">
                <CheckCircle2 size={24} className="text-veg" />
                <div>
                  <h4>All Ingredients Available!</h4>
                  <p>You have every single ingredient needed to prepare this recipe.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients You Already Have (if user entered any) */}
        {matchData.have.length > 0 && (
          <div className="have-ingredients-box glass-panel">
            <div className="have-box-header">
              <div className="have-header-title-wrap">
                <CheckCircle2 size={22} className="text-veg" />
                <div>
                  <h3 className="have-box-title">
                    Ingredients You Already Have ({matchData.have.length})
                  </h3>
                  <p className="have-box-subtitle">
                    Matched from your scanned pantry / text input:
                  </p>
                </div>
              </div>
              <span className="have-count-badge">{matchData.have.length} Available</span>
            </div>

            <div className="have-items-grid">
              {matchData.have.map((item, idx) => (
                <div key={idx} className="have-item-card">
                  <Check size={16} className="text-veg" />
                  <div className="have-item-info">
                    <span className="have-item-name">{item.name}</span>
                    {item.amount && <span className="have-item-amount">({item.amount})</span>}
                  </div>
                  <span className="in-pantry-badge">In Pantry</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: DOWN SIDE - STEP-BY-STEP PREPARATION STEPS */}
      {/* ========================================================================= */}
      <section className="preparation-steps-section glass-panel">
        <div className="prep-section-header">
          <div className="prep-header-left">
            <div className="chef-icon-wrap">
              <ChefHat size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="prep-title">Step-by-Step Preparation Steps</h2>
              <p className="prep-subtitle">
                Follow these instructions in sequence. Click each step when completed.
              </p>
            </div>
          </div>
          <span className="steps-total-pill">
            {Object.values(completedSteps).filter(Boolean).length} / {recipe.instructions.length} Done
          </span>
        </div>

        <div className="preparation-steps-timeline">
          {recipe.instructions.map((step, idx) => (
            <div 
              key={idx} 
              className={`preparation-step-card ${completedSteps[idx] ? 'step-completed' : ''}`}
              onClick={() => toggleStep(idx)}
            >
              <div className="prep-step-num-badge">
                {completedSteps[idx] ? <Check size={18} /> : idx + 1}
              </div>
              <div className="prep-step-content">
                <div className="prep-step-top">
                  <span className="step-tag">Step {idx + 1}</span>
                  <span className="step-check-label">
                    {completedSteps[idx] ? 'Completed ✓' : 'Mark as done'}
                  </span>
                </div>
                <p className="prep-instruction-text">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Macro Nutrition Breakdown Bar */}
      <section className="detail-nutrition-strip glass-panel">
        <h3 className="nutrition-heading">Nutritional Breakdown (Per Serving)</h3>
        <div className="macros-horizontal-grid">
          <div className="macro-spec">
            <span className="spec-label">Protein</span>
            <span className="spec-val text-protein">{recipe.protein}</span>
            <span className="spec-bar-fill" style={{ width: '80%', backgroundColor: '#8b5cf6' }}></span>
          </div>
          <div className="macro-spec">
            <span className="spec-label">Carbohydrates</span>
            <span className="spec-val">{recipe.carbs}</span>
            <span className="spec-bar-fill" style={{ width: '45%', backgroundColor: '#f59e0b' }}></span>
          </div>
          <div className="macro-spec">
            <span className="spec-label">Healthy Fats</span>
            <span className="spec-val">{recipe.fat}</span>
            <span className="spec-bar-fill" style={{ width: '35%', backgroundColor: '#ef4444' }}></span>
          </div>
          <div className="macro-spec">
            <span className="spec-label">Sodium (Salt)</span>
            <span className="spec-val">{recipe.sodium}</span>
            <span className="spec-bar-fill" style={{ width: '25%', backgroundColor: '#06b6d4' }}></span>
          </div>
          <div className="macro-spec">
            <span className="spec-label">Refined Sugar</span>
            <span className="spec-val">{recipe.sugar}</span>
            <span className="spec-bar-fill" style={{ width: '15%', backgroundColor: '#10b981' }}></span>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Action Bar for Meal Planner */}
      <div className="detail-bottom-actions glass-panel">
        <div className="bottom-action-left">
          <span className="quick-plan-title">Plan This Recipe</span>
          <span className="quick-plan-sub">Add to your weekly balanced schedule</span>
        </div>

        <div className="bottom-action-buttons">
          <button 
            type="button" 
            className="btn-primary btn-glow"
            onClick={handleAddToPlan}
            id="add-to-meal-plan-btn"
          >
            <Calendar size={18} />
            <span>{showPlanSuccess ? 'Added to Meal Plan! ✓' : 'Add to Today\'s Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
