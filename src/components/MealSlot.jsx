// src/components/MealSlot.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, Dumbbell, ChevronRight, RefreshCw } from 'lucide-react';
import './MealSlot.css';

export default function MealSlot({ slotTitle, timeSuggestion, recipe, onSwap, icon: SlotIcon }) {
  const navigate = useNavigate();

  if (!recipe) {
    return (
      <div className="meal-slot empty-slot glass-panel">
        <div className="slot-header">
          <span className="slot-name">{slotTitle}</span>
          <span className="slot-time">{timeSuggestion}</span>
        </div>
        <p className="empty-slot-msg">No recipe assigned yet.</p>
        <button type="button" className="btn-secondary btn-sm" onClick={onSwap}>
          + Pick a Recipe
        </button>
      </div>
    );
  }

  return (
    <div 
      className="meal-slot glass-panel-interactive"
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      id={`meal-slot-${slotTitle.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="slot-left-img">
        <img src={recipe.image} alt={recipe.title} className="slot-img" />
        <span className={`slot-diet-indicator ${recipe.dietType}`}></span>
      </div>

      <div className="slot-body">
        <div className="slot-header">
          <div className="slot-title-wrap">
            {SlotIcon && <SlotIcon size={14} className="slot-type-icon" />}
            <span className="slot-name">{slotTitle}</span>
          </div>
          <span className="slot-time">{timeSuggestion}</span>
        </div>

        <h4 className="slot-recipe-title">{recipe.title}</h4>

        <div className="slot-macros">
          <span className="macro-item">
            <Clock size={12} /> {recipe.time}m
          </span>
          <span className="macro-divider">•</span>
          <span className="macro-item">
            <Flame size={12} /> {recipe.calories} kcal
          </span>
          <span className="macro-divider">•</span>
          <span className="macro-item macro-protein">
            <Dumbbell size={12} /> {recipe.protein}
          </span>
        </div>
      </div>

      <div className="slot-actions">
        {onSwap && (
          <button 
            type="button" 
            className="slot-swap-btn" 
            title="Swap this meal"
            onClick={(e) => {
              e.stopPropagation();
              onSwap();
            }}
          >
            <RefreshCw size={14} />
          </button>
        )}
        <div className="slot-arrow">
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
}
