// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, Calendar, Compass, ArrowRight, Flame, Dumbbell, 
  Sparkles, Coffee, Sun, Moon, Utensils, ChevronRight
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import RecipeCard from '../components/RecipeCard';
import MealSlot from '../components/MealSlot';
import FilterBar from '../components/FilterBar';
import './Dashboard.css';

export default function Dashboard() {
  const { userProfile, recipes, mealPlan, currentUser } = useFoodCraft();
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter recipes based on quick filter
  const filteredRecipes = recipes.filter(rcp => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Veg') return rcp.dietType === 'veg';
    if (activeFilter === 'Non-Veg') return rcp.dietType === 'non-veg';
    if (activeFilter === 'Gym') return rcp.healthTags.some(t => t.includes('Protein') || t.includes('Gym'));
    if (activeFilter === 'Low Sugar') return rcp.healthTags.some(t => t.includes('Low Sugar'));
    if (activeFilter === 'Low Salt') return rcp.healthTags.some(t => t.includes('Low Salt'));
    if (activeFilter === 'Snacks') return rcp.mealType === 'Snacks';
    if (activeFilter === 'South Indian') return rcp.cuisine === 'South Indian';
    if (activeFilter === 'North Indian') return rcp.cuisine === 'North Indian';
    if (activeFilter === 'Quick') return rcp.time <= 20;
    return true;
  });

  const todayMeals = mealPlan[0]?.meals || {};

  const greetingName = currentUser?.name?.trim() 
    ? currentUser.name.trim().split(' ')[0] 
    : userProfile?.name?.trim() 
      ? userProfile.name.trim().split(' ')[0] 
      : 'Chef';

  return (
    <div className="dashboard-page page-wrapper">
      {/* Welcome Hero & Macros Strip */}
      <section className="dashboard-hero glass-panel animate-fade-in">
        <div className="dash-hero-top">
          <div className="dash-user-greeting">
            <span className="greeting-sub">Welcome to your kitchen hub</span>
            <h1 className="greeting-title">Hello, {greetingName} 👋</h1>
            <p className="greeting-desc">
              Your fridge scan detected <strong>5 active ingredients</strong>. We found <strong>14 matching recipes</strong> with &gt;88% semantic similarity.
            </p>
          </div>

          <Link to="/scan" className="btn-primary btn-glow hero-scan-cta" id="dash-scan-cta-btn">
            <Camera size={18} />
            <span>Scan Fridge (YOLOv8)</span>
          </Link>
        </div>

        {/* Nutrition Macro Summary */}
        <div className="dash-macro-tracker">
          <div className="macro-card">
            <div className="macro-card-header">
              <span className="macro-title">Daily Energy</span>
              <Flame size={16} className="macro-icon-flame" />
            </div>
            <div className="macro-values">
              <span className="macro-big">1,480</span>
              <span className="macro-max">/ {userProfile.dailyCalorieTarget} kcal</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill progress-flame" style={{ width: '70%' }}></div>
            </div>
          </div>

          <div className="macro-card">
            <div className="macro-card-header">
              <span className="macro-title">Protein Target</span>
              <Dumbbell size={16} className="macro-icon-protein" />
            </div>
            <div className="macro-values">
              <span className="macro-big">85g</span>
              <span className="macro-max">/ {userProfile.dailyProteinTarget}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill progress-protein" style={{ width: '72%' }}></div>
            </div>
          </div>

          <div className="macro-card">
            <div className="macro-card-header">
              <span className="macro-title">Recipe Matches</span>
              <Sparkles size={16} className="macro-icon-sparkle" />
            </div>
            <div className="macro-values">
              <span className="macro-big">96%</span>
              <span className="macro-max">Peak Match</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill progress-match" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Tiles */}
      <section className="quick-actions-grid">
        <Link to="/scan" className="action-tile tile-scan glass-panel-interactive" id="quick-action-scan">
          <div className="action-tile-icon box-primary">
            <Camera size={22} />
          </div>
          <div className="action-tile-text">
            <h4>Scan Ingredients</h4>
            <p>Upload fridge photo with YOLOv8</p>
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </Link>

        <Link to="/meal-plan" className="action-tile tile-plan glass-panel-interactive" id="quick-action-plan">
          <div className="action-tile-icon box-amber">
            <Calendar size={22} />
          </div>
          <div className="action-tile-text">
            <h4>7-Day Meal Plan</h4>
            <p>Breakfast, lunch, snacks & dinner</p>
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </Link>

        <Link to="/explore" className="action-tile tile-explore glass-panel-interactive" id="quick-action-explore">
          <div className="action-tile-icon box-green">
            <Compass size={22} />
          </div>
          <div className="action-tile-text">
            <h4>Explore Cuisines</h4>
            <p>South Indian, Gym, Low Sugar & more</p>
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </Link>
      </section>

      {/* Today's Meal Plan Timeline */}
      <section className="today-meals-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <Calendar size={20} className="text-primary" />
              <span>Today's Meal Schedule</span>
            </h2>
            <p className="section-subtitle">Monday, Sep 16 • Balanced 4-meal cycle</p>
          </div>
          <Link to="/meal-plan" className="view-all-link" id="dash-view-full-plan-link">
            <span>View 7 Days</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="today-slots-grid">
          <MealSlot
            slotTitle="Breakfast"
            timeSuggestion="08:30 AM"
            recipe={todayMeals.breakfast}
            icon={Coffee}
          />
          <MealSlot
            slotTitle="Lunch"
            timeSuggestion="01:15 PM"
            recipe={todayMeals.lunch}
            icon={Sun}
          />
          <MealSlot
            slotTitle="Evening Snacks"
            timeSuggestion="05:30 PM"
            recipe={todayMeals.snacks}
            icon={Utensils}
          />
          <MealSlot
            slotTitle="Dinner"
            timeSuggestion="08:45 PM"
            recipe={todayMeals.dinner}
            icon={Moon}
          />
        </div>
      </section>

      {/* Quick Filter Bar */}
      <section className="recipes-feed-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <Sparkles size={20} className="text-primary" />
              <span>Recommended Recipes</span>
            </h2>
            <p className="section-subtitle">Ranked by RecipeNLG 2.2M Semantic Match</p>
          </div>
          <Link to="/recipes" className="view-all-link" id="dash-view-all-recipes-link">
            <span>All ({recipes.length})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Recipe Grid */}
        <div className="recipes-grid">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>

        {filteredRecipes.length === 0 && (
          <div className="empty-state-box glass-panel">
            <Utensils size={36} className="empty-icon" />
            <h3>No recipes match this filter</h3>
            <p>Try clearing your filter or scan additional ingredients.</p>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => setActiveFilter('All')}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
