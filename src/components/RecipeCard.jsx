// src/components/RecipeCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, Star, Heart, Dumbbell, Zap } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './RecipeCard.css';

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFoodCraft();
  const favorite = isFavorite(recipe.id);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <article 
      className="recipe-card glass-panel" 
      onClick={handleCardClick}
      id={`recipe-card-${recipe.id}`}
    >
      {/* Image Thumbnail & Badges */}
      <div className="recipe-image-container">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="recipe-image" 
          loading="lazy" 
        />
        <div className="image-overlay-gradient"></div>

        {/* Top Badges */}
        <div className="card-top-badges">
          <div className="diet-badge-wrapper">
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
          </div>

          <button 
            type="button"
            className={`card-favorite-btn ${favorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
            id={`fav-btn-${recipe.id}`}
          >
            <Heart size={18} fill={favorite ? "#ef4444" : "none"} color={favorite ? "#ef4444" : "#ffffff"} />
          </button>
        </div>

        {/* Bottom Image Overlay: Match Score & Rating */}
        <div className="card-image-bottom">
          <span className="match-pill">
            <Zap size={13} />
            <span>{recipe.matchScore}% Match</span>
          </span>
          <span className="rating-pill">
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span>{recipe.rating}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="recipe-card-content">
        <div className="recipe-meta-sub">
          <span className="recipe-cuisine">{recipe.cuisine}</span>
          <span className="dot-separator">•</span>
          <span className="recipe-meal-type">{recipe.mealType}</span>
        </div>

        <h3 className="recipe-title">{recipe.title}</h3>
        <p className="recipe-description">{recipe.description}</p>

        {/* Health / Gym / Restriction Tags */}
        <div className="recipe-tags-list">
          {recipe.healthTags.slice(0, 2).map((tag, idx) => (
            <span 
              key={idx} 
              className={`tag-pill ${tag.includes('Protein') || tag.includes('Gym') ? 'tag-gym' : tag.includes('Sugar') ? 'tag-lowsugar' : 'tag-neutral'}`}
            >
              {tag.includes('Gym') || tag.includes('Protein') ? <Dumbbell size={11} /> : null}
              <span>{tag}</span>
            </span>
          ))}
        </div>

        {/* Footer Metrics */}
        <div className="recipe-card-footer">
          <div className="metric-item" title="Cooking Time">
            <Clock size={14} className="metric-icon" />
            <span>{recipe.time}m</span>
          </div>
          <div className="metric-item" title="Calories">
            <Flame size={14} className="metric-icon" />
            <span>{recipe.calories} kcal</span>
          </div>
          <div className="metric-item highlight-protein" title="Protein Content">
            <span className="protein-label">P:</span>
            <span>{recipe.protein}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
