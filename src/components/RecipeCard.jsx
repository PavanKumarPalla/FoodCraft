// src/components/RecipeCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, Heart, Dumbbell, ArrowRight } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './RecipeCard.css';

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFoodCraft();
  const favorite = isFavorite(recipe.id);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(recipe);
  };

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const recipeImage = recipe.image || "/images/diet_salad.jpg";

  return (
    <article 
      className="recipe-card botanical-recipe-card" 
      onClick={handleCardClick}
      id={`recipe-card-${recipe.id}`}
    >
      {/* Top Image Wrap with Heart Button */}
      <div className="card-image-wrap">
        <img 
          src={recipeImage} 
          alt={recipe.title} 
          className="card-dish-img"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = "/images/diet_salad.jpg"; }}
        />
        <button 
          type="button"
          className={`card-heart-btn ${favorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
          id={`fav-btn-${recipe.id}`}
        >
          <Heart size={18} fill={favorite ? "#ef4444" : "none"} color={favorite ? "#ef4444" : "#64748b"} />
        </button>

        {recipe.dietType && (
          <span className={`card-diet-chip ${recipe.dietType}`}>
            {recipe.dietType === 'veg' ? 'Veg' : recipe.dietType === 'non-veg' ? 'Non-Veg' : 'Egg'}
          </span>
        )}
      </div>

      <div className="card-content-body">
        {/* Cuisine & Meal Type */}
        <div className="card-meta-tags">
          <span className="card-cuisine-tag">{recipe.cuisine || "Fusion"}</span>
          {recipe.mealType && (
            <span className="card-meal-tag">{recipe.mealType}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="card-title">{recipe.title}</h3>
        {recipe.description && (
          <p className="card-desc">{recipe.description}</p>
        )}

        {/* Health Tags */}
        {recipe.healthTags && recipe.healthTags.length > 0 && (
          <div className="card-health-tags">
            {recipe.healthTags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="health-tag-pill">
                {tag.includes('Gym') || tag.includes('Protein') ? <Dumbbell size={10} /> : null}
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Footer Metrics */}
        <div className="card-footer-metrics">
          <div className="card-metric" title="Cooking Time">
            <Clock size={14} className="metric-icon-green" />
            <span>{recipe.time || 20} mins</span>
          </div>

          {recipe.calories && (
            <div className="card-metric" title="Calories">
              <Flame size={14} className="metric-icon-flame" />
              <span>{recipe.calories} kcal</span>
            </div>
          )}
        </div>

        {/* View Recipe Button */}
        <button 
          className="card-view-btn"
          onClick={handleCardClick}
        >
          <span>View Recipe</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}
