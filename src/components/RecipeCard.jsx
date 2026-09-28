// src/components/RecipeCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, Star, Heart, Dumbbell, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import { matchRecipeIngredients } from '../utils/ingredientMatcher';
import './RecipeCard.css';

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const { scannedIngredients, isFavorite, toggleFavorite } = useFoodCraft();
  const favorite = isFavorite(recipe.id);

  const matchData = matchRecipeIngredients(recipe.ingredients, scannedIngredients);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <article 
      className="recipe-card text-first-card glass-panel" 
      onClick={handleCardClick}
      id={`recipe-card-${recipe.id}`}
    >
      {/* Top Header Row: Diet Type, Cuisine & Favorite */}
      <div className="card-top-bar">
        <div className="card-pill-group">
          {recipe.dietType === 'veg' && (
            <span className="badge badge-veg">
              <span className="dot-veg"></span> Veg
            </span>
          )}
          {recipe.dietType === 'non-veg' && (
            <span className="badge badge-nonveg">
              <span className="dot-nonveg"></span> Non-Veg
            </span>
          )}
          {recipe.dietType === 'egg' && (
            <span className="badge badge-match">
              🥚 Egg
            </span>
          )}
          <span className="card-cuisine-tag">{recipe.cuisine}</span>
        </div>

        <button 
          type="button"
          className={`card-favorite-btn ${favorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
          id={`fav-btn-${recipe.id}`}
        >
          <Heart size={18} fill={favorite ? "#ef4444" : "none"} color={favorite ? "#ef4444" : "var(--text-secondary)"} />
        </button>
      </div>

      {/* Main Recipe Title & Description */}
      <div className="card-title-section">
        <h3 className="recipe-title">{recipe.title}</h3>
        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}
      </div>

      {/* Ingredients Breakdown: Have vs Missing */}
      <div className="card-ingredients-breakdown">
        {scannedIngredients.length > 0 ? (
          <>
            {/* Ingredients You Have */}
            <div className="ing-status-row have-row">
              <div className="ing-status-label">
                <CheckCircle2 size={14} className="text-veg" />
                <span>You Have ({matchData.have.length}):</span>
              </div>
              <div className="ing-mini-tags">
                {matchData.have.length > 0 ? (
                  matchData.have.map((h, i) => (
                    <span key={i} className="mini-tag tag-have">{h.name}</span>
                  ))
                ) : (
                  <span className="mini-tag tag-muted">None from selected</span>
                )}
              </div>
            </div>

            {/* Ingredients You Need To Have (Missing) */}
            <div className="ing-status-row missing-row">
              <div className="ing-status-label">
                <AlertTriangle size={14} className="text-warning" />
                <span>You Have To Have These Also ({matchData.missing.length}):</span>
              </div>
              <div className="ing-mini-tags">
                {matchData.missing.slice(0, 5).map((m, i) => (
                  <span key={i} className="mini-tag tag-missing">{m.name}</span>
                ))}
                {matchData.missing.length > 5 && (
                  <span className="mini-tag tag-more">+{matchData.missing.length - 5} more</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="ing-status-row">
            <span className="total-ingredients-note">
              📋 Requires <strong>{recipe.ingredients.length} ingredients</strong>
            </span>
          </div>
        )}
      </div>

      {/* Health / Gym / Feature Tags */}
      {recipe.healthTags && recipe.healthTags.length > 0 && (
        <div className="recipe-tags-list">
          {recipe.healthTags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx} 
              className={`tag-pill ${tag.includes('Protein') || tag.includes('Gym') ? 'tag-gym' : tag.includes('Sugar') ? 'tag-lowsugar' : 'tag-neutral'}`}
            >
              {tag.includes('Gym') || tag.includes('Protein') ? <Dumbbell size={11} /> : null}
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer Metrics & CTA */}
      <div className="recipe-card-footer">
        <div className="footer-metrics-group">
          <div className="metric-item" title="Cooking Time">
            <Clock size={14} className="metric-icon" />
            <span>{recipe.time}m</span>
          </div>
          <div className="metric-item" title="Calories">
            <Flame size={14} className="metric-icon text-flame" />
            <span>{recipe.calories} kcal</span>
          </div>
          {recipe.protein && (
            <div className="metric-item highlight-protein" title="Protein Content">
              <span className="protein-label">P:</span>
              <span>{recipe.protein}</span>
            </div>
          )}
          <div className="metric-item" title="Rating">
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span>{recipe.rating || 4.8}</span>
          </div>
        </div>

        <span className="card-cta-link">
          <span>View Missing & Steps</span>
          <ArrowRight size={14} />
        </span>
      </div>

    </article>
  );
}
