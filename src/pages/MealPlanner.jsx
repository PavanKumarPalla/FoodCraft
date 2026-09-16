// src/pages/MealPlanner.jsx
import React, { useState } from 'react';
import { 
  Calendar, RefreshCw, Coffee, Sun, Moon, Utensils
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import MealSlot from '../components/MealSlot';
import './MealPlanner.css';

export default function MealPlanner() {
  const { mealPlan, setMealPlan, recipes } = useFoodCraft();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
  const [plannerGoal, setPlannerGoal] = useState('Gym'); // 'Gym' | 'Veg' | 'LowSugar' | 'LowSalt'
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(null); // { dayIdx, slotKey }

  const currentDay = mealPlan[selectedDayIndex] || mealPlan[0];
  const currentMeals = currentDay.meals || {};

  // Calculate day totals
  const dayMealsList = Object.values(currentMeals).filter(Boolean);
  const totalCalories = dayMealsList.reduce((sum, r) => sum + (r.calories || 0), 0);
  const totalProtein = dayMealsList.reduce((sum, r) => sum + parseInt(r.protein || 0), 0);
  const totalCarbs = dayMealsList.reduce((sum, r) => sum + parseInt(r.carbs || 0), 0);
  const totalFat = dayMealsList.reduce((sum, r) => sum + parseInt(r.fat || 0), 0);

  // Auto Generate / Re-roll 7-Day Plan according to selected preference
  const handleAutoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);

      // Filter catalogue based on goal
      let pool = [...recipes];
      if (plannerGoal === 'Veg') {
        pool = recipes.filter(r => r.dietType === 'veg');
      } else if (plannerGoal === 'Gym') {
        pool = recipes.filter(r => r.healthTags.some(t => t.includes('Protein') || t.includes('Gym')));
      } else if (plannerGoal === 'LowSugar') {
        pool = recipes.filter(r => r.healthTags.some(t => t.includes('Low Sugar')));
      } else if (plannerGoal === 'LowSalt') {
        pool = recipes.filter(r => r.healthTags.some(t => t.includes('Low Salt')));
      }

      if (pool.length === 0) pool = [...recipes];

      // Re-populate all 7 days
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dates = ["Sep 16", "Sep 17", "Sep 18", "Sep 19", "Sep 20", "Sep 21", "Sep 22"];

      const breakfasts = recipes.filter(r => r.mealType === 'Breakfast');
      const lunches = pool.filter(r => r.mealType === 'Lunch').length ? pool.filter(r => r.mealType === 'Lunch') : pool;
      const snacks = recipes.filter(r => r.mealType === 'Snacks').length ? recipes.filter(r => r.mealType === 'Snacks') : pool;
      const dinners = pool.filter(r => r.mealType === 'Dinner').length ? pool.filter(r => r.mealType === 'Dinner') : pool;

      const newPlan = days.map((day, i) => ({
        day,
        date: dates[i],
        meals: {
          breakfast: breakfasts[i % breakfasts.length] || recipes[0],
          lunch: lunches[(i + 1) % lunches.length] || recipes[1],
          snacks: snacks[(i + 2) % snacks.length] || recipes[4],
          dinner: dinners[(i + 3) % dinners.length] || recipes[2]
        }
      }));

      setMealPlan(newPlan);
    }, 600);
  };

  const handleSwapSelection = (replacementRecipe) => {
    if (!showSwapModal) return;
    const { dayIdx, slotKey } = showSwapModal;

    setMealPlan(prev => {
      const updated = [...prev];
      updated[dayIdx] = {
        ...updated[dayIdx],
        meals: {
          ...updated[dayIdx].meals,
          [slotKey]: replacementRecipe
        }
      };
      return updated;
    });

    setShowSwapModal(null);
  };

  return (
    <div className="planner-page page-wrapper">
      {/* Header */}
      <div className="planner-header animate-fade-in">
        <div>
          <div className="planner-badge">
            <Calendar size={14} />
            <span>7-Day Automated Nutrition Engine</span>
          </div>
          <h1 className="planner-title">Weekly Meal Planner</h1>
          <p className="planner-subtitle">
            Curated 4-meal daily schedules tailored to your culinary goals & dietary profile
          </p>
        </div>

        {/* View Toggle */}
        <div className="planner-view-toggle glass-panel">
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
            id="planner-view-daily"
          >
            Daily View
          </button>
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
            id="planner-view-weekly"
          >
            7-Day Overview
          </button>
        </div>
      </div>

      {/* Auto Generate & Customizer Bar */}
      <div className="planner-controls-bar glass-panel">
        <div className="goal-selector-group">
          <span className="goal-label">Plan Goal:</span>
          <div className="goal-buttons">
            <button
              type="button"
              className={`goal-btn ${plannerGoal === 'Gym' ? 'active' : ''}`}
              onClick={() => setPlannerGoal('Gym')}
            >
              💪 Gym Protein
            </button>
            <button
              type="button"
              className={`goal-btn ${plannerGoal === 'Veg' ? 'active' : ''}`}
              onClick={() => setPlannerGoal('Veg')}
            >
              🥗 Pure Veg
            </button>
            <button
              type="button"
              className={`goal-btn ${plannerGoal === 'LowSugar' ? 'active' : ''}`}
              onClick={() => setPlannerGoal('LowSugar')}
            >
              🍬 Low Sugar
            </button>
            <button
              type="button"
              className={`goal-btn ${plannerGoal === 'LowSalt' ? 'active' : ''}`}
              onClick={() => setPlannerGoal('LowSalt')}
            >
              🧂 Low Salt
            </button>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary btn-glow auto-gen-btn"
          onClick={handleAutoGenerate}
          disabled={isGenerating}
          id="auto-generate-plan-btn"
        >
          <RefreshCw size={16} className={isGenerating ? 'spin-icon' : ''} />
          <span>{isGenerating ? 'Generating 7-Day Plan...' : 'Auto-Generate Full Week'}</span>
        </button>
      </div>

      {/* Day Selector Pills */}
      <div className="day-selector-track">
        {mealPlan.map((dayItem, idx) => (
          <button
            key={dayItem.day}
            type="button"
            className={`day-pill-card glass-panel ${selectedDayIndex === idx ? 'active' : ''}`}
            onClick={() => setSelectedDayIndex(idx)}
            id={`day-pill-${dayItem.day.toLowerCase()}`}
          >
            <span className="day-name">{dayItem.day.slice(0, 3)}</span>
            <span className="day-date">{dayItem.date}</span>
          </button>
        ))}
      </div>

      {viewMode === 'daily' ? (
        /* Daily View */
        <div className="daily-view-layout">
          {/* Day Macros Header */}
          <div className="day-macros-summary glass-panel">
            <div className="day-meta-left">
              <h2 className="current-day-heading">{currentDay.day}, {currentDay.date}</h2>
              <span className="current-day-sub">4 Scheduled Meals • Fully Balanced</span>
            </div>

            <div className="day-macros-right">
              <div className="day-macro-stat">
                <span className="macro-stat-label">Energy</span>
                <span className="macro-stat-val text-flame">{totalCalories} kcal</span>
              </div>
              <div className="day-macro-stat">
                <span className="macro-stat-label">Protein</span>
                <span className="macro-stat-val text-protein">{totalProtein}g</span>
              </div>
              <div className="day-macro-stat">
                <span className="macro-stat-label">Carbs</span>
                <span className="macro-stat-val">{totalCarbs}g</span>
              </div>
              <div className="day-macro-stat">
                <span className="macro-stat-label">Fats</span>
                <span className="macro-stat-val">{totalFat}g</span>
              </div>
            </div>
          </div>

          {/* 4 Meal Slots */}
          <div className="daily-slots-container">
            <MealSlot
              slotTitle="Breakfast"
              timeSuggestion="08:30 AM"
              recipe={currentMeals.breakfast}
              icon={Coffee}
              onSwap={() => setShowSwapModal({ dayIdx: selectedDayIndex, slotKey: 'breakfast' })}
            />
            <MealSlot
              slotTitle="Lunch"
              timeSuggestion="01:15 PM"
              recipe={currentMeals.lunch}
              icon={Sun}
              onSwap={() => setShowSwapModal({ dayIdx: selectedDayIndex, slotKey: 'lunch' })}
            />
            <MealSlot
              slotTitle="Evening Snacks"
              timeSuggestion="05:30 PM"
              recipe={currentMeals.snacks}
              icon={Utensils}
              onSwap={() => setShowSwapModal({ dayIdx: selectedDayIndex, slotKey: 'snacks' })}
            />
            <MealSlot
              slotTitle="Dinner"
              timeSuggestion="08:45 PM"
              recipe={currentMeals.dinner}
              icon={Moon}
              onSwap={() => setShowSwapModal({ dayIdx: selectedDayIndex, slotKey: 'dinner' })}
            />
          </div>
        </div>
      ) : (
        /* 7-Day Weekly Grid */
        <div className="weekly-grid-layout">
          {mealPlan.map((dayItem) => (
            <div key={dayItem.day} className="weekly-day-card glass-panel">
              <div className="weekly-card-header">
                <h3>{dayItem.day}</h3>
                <span className="weekly-date-badge">{dayItem.date}</span>
              </div>

              <div className="weekly-day-slots">
                {['breakfast', 'lunch', 'snacks', 'dinner'].map(slot => {
                  const r = dayItem.meals[slot];
                  return (
                    <div key={slot} className="weekly-slot-mini">
                      <span className="slot-mini-label">{slot}</span>
                      {r ? (
                        <div className="slot-mini-info">
                          <span className="slot-mini-title">{r.title}</span>
                          <span className="slot-mini-cal">{r.calories} kcal</span>
                        </div>
                      ) : (
                        <span className="slot-mini-empty">Empty</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="modal-backdrop" onClick={() => setShowSwapModal(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pick Replacement for {showSwapModal.slotKey.toUpperCase()}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowSwapModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-recipes-list">
              {recipes.map(rec => (
                <div 
                  key={rec.id} 
                  className="modal-recipe-item"
                  onClick={() => handleSwapSelection(rec)}
                >
                  <img src={rec.image} alt={rec.title} className="modal-recipe-img" />
                  <div className="modal-recipe-info">
                    <h4>{rec.title}</h4>
                    <span className="modal-recipe-meta">{rec.cuisine} • {rec.calories} kcal • {rec.protein} protein</span>
                  </div>
                  <button type="button" className="btn-secondary btn-sm">Select</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
