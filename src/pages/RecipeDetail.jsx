// src/pages/RecipeDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Clock, Users, Flame, Dumbbell, 
  Check, Calendar, Sparkles, ChefHat
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './RecipeDetail.css';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, isFavorite, toggleFavorite, setMealPlan } = useFoodCraft();

  const recipe = recipes.find(r => r.id === id) || recipes[0];
  const favorite = isFavorite(recipe.id);

  // Checkbox states for ingredients & steps
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});
  const [showPlanSuccess, setShowPlanSuccess] = useState(false);

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

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

  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;

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

      {/* Hero Media Card */}
      <div className="detail-hero glass-panel">
        <div className="detail-hero-media">
          <img src={recipe.image} alt={recipe.title} className="detail-hero-img" />
          <div className="detail-hero-overlay"></div>

          <div className="detail-hero-floating-badges">
            <span className={`badge badge-${recipe.dietType}`}>
              {recipe.dietType === 'veg' ? '🟢 Veg' : recipe.dietType === 'non-veg' ? '🔴 Non-Veg' : '🥚 Egg'}
            </span>
            <span className="badge badge-match">
              <Sparkles size={12} />
              <span>{recipe.matchScore}% Match</span>
            </span>
          </div>
        </div>

        {/* Hero Meta Info */}
        <div className="detail-hero-body">
          <div className="detail-cuisine-row">
            <span className="detail-cuisine-badge">{recipe.cuisine}</span>
            <span className="dot-sep">•</span>
            <span className="detail-meal-badge">{recipe.mealType}</span>
            <span className="dot-sep">•</span>
            <span className="detail-diff-badge">{recipe.difficulty} Prep</span>
          </div>

          <h1 className="detail-title">{recipe.title}</h1>
          <p className="detail-desc">{recipe.description}</p>

          {/* Health & Diet Tags */}
          <div className="detail-tags-row">
            {recipe.healthTags.map((tag, idx) => (
              <span key={idx} className="detail-tag-pill">
                {tag}
              </span>
            ))}
          </div>

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
        </div>
      </div>

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

      {/* Two Column Layout: Ingredients Checklist & Step-by-Step Instructions */}
      <div className="recipe-cooking-grid">
        {/* Ingredients Checklist */}
        <section className="cooking-section glass-panel">
          <div className="section-head-flex">
            <div>
              <h2 className="cook-head-title">Ingredients Checklist</h2>
              <p className="cook-head-sub">
                {checkedCount} of {recipe.ingredients.length} items collected
              </p>
            </div>
            <span className="items-count-tag">{recipe.ingredients.length} Total</span>
          </div>

          <div className="ingredients-checklist-box">
            {recipe.ingredients.map((ing, idx) => (
              <div 
                key={idx} 
                className={`ingredient-check-item ${checkedIngredients[idx] ? 'checked' : ''}`}
                onClick={() => toggleIngredient(idx)}
              >
                <div className="custom-check-box">
                  {checkedIngredients[idx] ? <Check size={14} /> : null}
                </div>
                <div className="ing-info">
                  <span className="ing-name">{ing.name}</span>
                  <span className="ing-amount">{ing.amount}</span>
                </div>
                {ing.available && (
                  <span className="in-fridge-badge">In Fridge</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Step by Step Instructions */}
        <section className="cooking-section glass-panel">
          <div className="section-head-flex">
            <div>
              <h2 className="cook-head-title">Cooking Method</h2>
              <p className="cook-head-sub">Verified steps from RecipeNLG dataset</p>
            </div>
            <ChefHat size={22} className="text-primary" />
          </div>

          <div className="steps-timeline">
            {recipe.instructions.map((step, idx) => (
              <div 
                key={idx} 
                className={`step-card ${completedSteps[idx] ? 'completed' : ''}`}
                onClick={() => toggleStep(idx)}
              >
                <div className="step-number-circle">
                  {completedSteps[idx] ? <Check size={16} /> : idx + 1}
                </div>
                <div className="step-text-wrap">
                  <span className="step-tag">Step {idx + 1}</span>
                  <p className="step-instruction">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

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
