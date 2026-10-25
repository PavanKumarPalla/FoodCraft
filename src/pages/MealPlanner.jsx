// src/pages/MealPlanner.jsx
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Coffee, Sun, Moon, Clock, Flame, Dumbbell, 
  ChevronRight, BookOpen, CheckCircle2, Database, AlertCircle, 
  Sparkles, Layers, X
} from 'lucide-react';
import { 
  SOUTH_INDIAN_7_DAY_PLAN, 
  NORTH_INDIAN_7_DAY_PLAN, 
  SOUTH_INDIAN_RECIPES,
  getDynamicWeekDates 
} from '../data/mealPlanData';
import './MealPlanner.css';

export default function MealPlanner() {
  const [cuisineRegion, setCuisineRegion] = useState('south'); // 'south' | 'north'
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
  const [activePreparationRecipe, setActivePreparationRecipe] = useState(null);
  const [showDatasetReport, setShowDatasetReport] = useState(false);
  const [selectedMealOption, setSelectedMealOption] = useState({}); // { [day_slot]: optionName }

  // Compute live dynamic week dates
  const weekDates = useMemo(() => getDynamicWeekDates(), []);

  // Determine active plan based on cuisine region
  const activePlanList = useMemo(() => {
    return cuisineRegion === 'south' ? SOUTH_INDIAN_7_DAY_PLAN : NORTH_INDIAN_7_DAY_PLAN;
  }, [cuisineRegion]);

  const currentDayData = activePlanList[selectedDayIndex] || activePlanList[0];
  const currentDateInfo = weekDates[selectedDayIndex] || weekDates[0];

  const OPTION_IMAGE_MAP = {
    "Upma": "/images/meal_planner_images/upma.jpg",
    "Rice, Dal, Carrot Poriyal": "/images/meal_planner_images/rice_dal_carrot.jpg",
    "Chicken Biryani": "/images/meal_planner_images/chicken_biryani.jpg",
    "Chicken Curry with Bagara Rice": "/images/meal_planner_images/bagara_rice.jpg",
    "Non-Veg: Chicken Curry with Bagara Rice": "/images/meal_planner_images/bagara_rice.jpg",
    "Mutton Biryani": "/images/meal_planner_images/mutton_biryani.jpg",
    "Chapati with Vegetable Curry": "/images/meal_planner_images/chapati.jpg",
    "Veg: Chapati with Vegetable Curry": "/images/meal_planner_images/chapati.jpg",
    "Chapati with Dal": "/images/meal_planner_images/chapati.jpg",
    "Veg: Chapati with Dal": "/images/meal_planner_images/chapati.jpg",
    "Chapati with Paneer Curry": "/images/meal_planner_images/paneer_curry.jpg",
    "Rice, Dal, Cluster Beans (Goruchikkudu)": "/images/meal_planner_images/rice_dal_carrot.jpg",
    "Rice, Dal, Aloo Fry": "/images/meal_planner_images/rice_dal_carrot.jpg",
    "Rice, Dal, Bendakaya (Okra) Fry": "/images/meal_planner_images/tomato_rice.jpg",
    "Rice, Dal, Gutti Vankaya (Brinjal Curry)": "/images/meal_planner_images/lemon_rice.jpg",
    "Idli, Chutney": "/images/meal_planner_images/idli_vada.jpg",
    "Idli with Chutney & Sambar": "/images/meal_planner_images/idli_vada.jpg",
    "Dosa, Chutney": "/images/meal_planner_images/dosa.jpg",
    "Crispy Dosa with Chutney": "/images/meal_planner_images/dosa.jpg",
    "Poori with Curry": "/images/meal_planner_images/poori.jpg",
    "Poori with Potato Curry": "/images/meal_planner_images/poori.jpg",
    "Veg Pulav": "/images/meal_planner_images/pulav.jpg"
  };

  // Helper to get active meal object (accounting for option selection)
  const getMealData = (dayIndex, slot) => {
    const day = activePlanList[dayIndex] || activePlanList[0];
    const baseMeal = day.meals[slot];
    if (!baseMeal) return null;

    const optKey = `${day.day}_${slot}`;
    const selectedOpt = selectedMealOption[optKey];

    // If user picked an alternative option, try to adapt title and image
    if (selectedOpt && selectedOpt !== baseMeal.title) {
      return {
        ...baseMeal,
        title: selectedOpt,
        image: OPTION_IMAGE_MAP[selectedOpt] || baseMeal.image
      };
    }
    return baseMeal;
  };

  const currentMeals = {
    breakfast: getMealData(selectedDayIndex, 'breakfast'),
    lunch: getMealData(selectedDayIndex, 'lunch'),
    dinner: getMealData(selectedDayIndex, 'dinner')
  };

  // Calculate dynamic day nutrition totals
  const dayMealsList = [currentMeals.breakfast, currentMeals.lunch, currentMeals.dinner].filter(Boolean);
  const totalCalories = dayMealsList.reduce((sum, r) => sum + (r.calories || 0), 0);
  const totalProtein = dayMealsList.reduce((sum, r) => sum + parseInt(r.protein || 0), 0);
  const totalCarbs = dayMealsList.reduce((sum, r) => sum + parseInt(r.carbs || 0), 0);
  const totalFat = dayMealsList.reduce((sum, r) => sum + parseInt(r.fat || 0), 0);

  // Handle recipe card click to open preparation instructions
  const handleOpenPreparation = (meal) => {
    if (!meal) return;
    // Check if we have an explicit recipe ID in SOUTH_INDIAN_RECIPES
    let recipeDetails = null;
    if (meal.recipeId && SOUTH_INDIAN_RECIPES[meal.recipeId]) {
      recipeDetails = SOUTH_INDIAN_RECIPES[meal.recipeId];
    } else {
      // Find matching by keyword
      const key = Object.keys(SOUTH_INDIAN_RECIPES).find(k => 
        meal.title.toLowerCase().includes(k.split('-')[0])
      );
      if (key) {
        recipeDetails = SOUTH_INDIAN_RECIPES[key];
      }
    }

    // Fallback template if custom recipe is not in dictionary
    if (!recipeDetails) {
      recipeDetails = {
        title: meal.title,
        subtitle: meal.description,
        image: meal.image,
        mealType: meal.slotTitle || "Meal",
        cuisine: cuisineRegion === 'south' ? "South Indian" : "North Indian",
        dietType: meal.dietType || "veg",
        time: meal.time || 25,
        calories: meal.calories || 420,
        protein: meal.protein || "14g",
        carbs: meal.carbs || "68g",
        fat: meal.fat || "12g",
        datasetStatus: "Authentic Regional Culinary Guide",
        ingredients: [
          { name: "Main Grains / Rice / Wheat", amount: "1.5 cups" },
          { name: "Lentils / Dal / Protein", amount: "1 cup" },
          { name: "Traditional Seasoning & Spices (Mustard, Cumin, Curry Leaves)", amount: "1 tbsp" },
          { name: "Fresh Produce / Vegetables", amount: "1.5 cups" },
          { name: "Ghee / Healthy Cooking Oil", amount: "1.5 tbsp" }
        ],
        instructions: [
          "Wash and prepare the fresh vegetables, grains, and protein components.",
          "Heat oil or ghee in a heavy-bottomed vessel; temper with mustard seeds, cumin, and curry leaves.",
          "Add aromatics (onions, ginger, garlic, green chilies) and sauté until golden.",
          "Incorporate spices, salt, and water; cook covered on medium-low flame until tender and flavors meld.",
          "Finish with fresh coriander leaves, a squeeze of lemon or a dollop of ghee, and serve steaming hot."
        ]
      };
    }

    setActivePreparationRecipe(recipeDetails);
  };

  return (
    <div className="planner-page page-wrapper">
      {/* Header */}
      <div className="planner-header animate-fade-in">
        <div>
          <div className="planner-badge">
            <Calendar size={14} />
            <span>7-Day Authentic Nutrition Engine</span>
          </div>
          <h1 className="planner-title">Weekly Meal Planner</h1>
          <p className="planner-subtitle">
            Personalized breakfast, lunch, and dinner plans with step-by-step preparation and Hugging Face dataset verification
          </p>
        </div>

        {/* Action Controls: Dataset Analysis & View Toggle */}
        <div className="planner-header-actions">
          <button 
            type="button" 
            className="dataset-report-btn glass-panel"
            onClick={() => setShowDatasetReport(true)}
            id="view-dataset-report-btn"
          >
            <Database size={15} />
            <span>Dataset Report</span>
          </button>

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
              7-Day Grid
            </button>
          </div>
        </div>
      </div>

      {/* Cuisine Region Selector Tabs */}
      <div className="cuisine-region-selector glass-panel">
        <button
          type="button"
          className={`region-tab-btn ${cuisineRegion === 'south' ? 'active' : ''}`}
          onClick={() => { setCuisineRegion('south'); setSelectedDayIndex(0); }}
          id="select-south-indian-tab"
        >
          <span className="region-emoji">🌴</span>
          <div className="region-text">
            <span className="region-title">South Indian Menu</span>
            <span className="region-subtitle">Dosa, Idli, Pongal, Biryani, Full Meals, Sambar Sadam</span>
          </div>
        </button>

        <button
          type="button"
          className={`region-tab-btn ${cuisineRegion === 'north' ? 'active' : ''}`}
          onClick={() => { setCuisineRegion('north'); setSelectedDayIndex(0); }}
          id="select-north-indian-tab"
        >
          <span className="region-emoji">🏔️</span>
          <div className="region-text">
            <span className="region-title">North Indian Menu</span>
            <span className="region-subtitle">Paratha, Chole Bhature, Rajma Chawal, Dal Makhani, Phulka</span>
          </div>
        </button>
      </div>

      {/* Up-to-Date 7-Day Selector Track */}
      <div className="day-selector-track">
        {weekDates.map((dayItem, idx) => (
          <button
            key={dayItem.day}
            type="button"
            className={`day-pill-card glass-panel ${selectedDayIndex === idx ? 'active' : ''} ${dayItem.isToday ? 'is-today' : ''}`}
            onClick={() => setSelectedDayIndex(idx)}
            id={`day-pill-${dayItem.day.toLowerCase()}`}
          >
            <div className="day-pill-top">
              <span className="day-name">{dayItem.day.slice(0, 3)}</span>
              {dayItem.isToday && <span className="today-chip">Today</span>}
            </div>
            <span className="day-date">{dayItem.date}</span>
          </button>
        ))}
      </div>

      {viewMode === 'daily' ? (
        /* Daily View Layout */
        <div className="daily-view-layout">
          {/* Day Macros & Nutrition Summary Card */}
          <div className="day-macros-summary glass-panel">
            <div className="day-meta-left">
              <div className="day-date-tag">
                <Calendar size={14} />
                <span>{currentDateInfo.fullDate}</span>
              </div>
              <h2 className="current-day-heading">{currentDayData.day}'s Schedule</h2>
              <span className="current-day-sub">
                {cuisineRegion === 'south' ? 'Authentic South Indian Culinary Routine' : 'Classic North Indian Homestyle Menu'}
              </span>
            </div>

            <div className="day-macros-right">
              <div className="day-macro-stat">
                <span className="macro-stat-label">Daily Calories</span>
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

          {/* 3 Main Meal Slots: Breakfast, Lunch, Dinner */}
          <div className="daily-slots-container">
            {/* Breakfast */}
            <div 
              className="meal-card-premium glass-panel-interactive"
              onClick={() => handleOpenPreparation(currentMeals.breakfast)}
              id="meal-slot-breakfast"
            >
              <div className="meal-card-img-wrap">
                <img src={currentMeals.breakfast.image} alt={currentMeals.breakfast.title} className="meal-card-img" />
                <span className="meal-time-badge">
                  <Coffee size={13} /> 08:30 AM
                </span>
                <span className={`slot-diet-indicator ${currentMeals.breakfast.dietType}`}></span>
              </div>

              <div className="meal-card-content">
                <div className="meal-card-header">
                  <span className="slot-badge-label">Breakfast</span>
                  <div className="card-macros-inline">
                    <span className="macro-pill"><Clock size={11} /> {currentMeals.breakfast.time}m</span>
                    <span className="macro-pill text-flame"><Flame size={11} /> {currentMeals.breakfast.calories} kcal</span>
                    <span className="macro-pill text-protein"><Dumbbell size={11} /> {currentMeals.breakfast.protein}</span>
                  </div>
                </div>

                <h3 className="meal-card-title">{currentMeals.breakfast.title}</h3>
                <p className="meal-card-desc">{currentMeals.breakfast.description}</p>

                <div className="meal-card-footer">
                  <button type="button" className="recipe-prep-cta">
                    <BookOpen size={13} />
                    <span>View Preparation</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Lunch */}
            <div 
              className="meal-card-premium glass-panel-interactive"
              onClick={() => handleOpenPreparation(currentMeals.lunch)}
              id="meal-slot-lunch"
            >
              <div className="meal-card-img-wrap">
                <img src={currentMeals.lunch.image} alt={currentMeals.lunch.title} className="meal-card-img" />
                <span className="meal-time-badge">
                  <Sun size={13} /> 01:15 PM
                </span>
                <span className={`slot-diet-indicator ${currentMeals.lunch.dietType}`}></span>
              </div>

              <div className="meal-card-content">
                <div className="meal-card-header">
                  <span className="slot-badge-label">Lunch</span>
                  <div className="card-macros-inline">
                    <span className="macro-pill"><Clock size={11} /> {currentMeals.lunch.time}m</span>
                    <span className="macro-pill text-flame"><Flame size={11} /> {currentMeals.lunch.calories} kcal</span>
                    <span className="macro-pill text-protein"><Dumbbell size={11} /> {currentMeals.lunch.protein}</span>
                  </div>
                </div>

                <h3 className="meal-card-title">{currentMeals.lunch.title}</h3>
                <p className="meal-card-desc">{currentMeals.lunch.description}</p>

                {/* Optional dishes switcher if multiple choices exist */}
                {currentMeals.lunch.options && currentMeals.lunch.options.length > 0 && (
                  <div className="meal-options-box" onClick={e => e.stopPropagation()}>
                    <span className="options-hint">Available Choices:</span>
                    <div className="options-chip-row">
                      {currentMeals.lunch.options.slice(0, 4).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`opt-chip ${currentMeals.lunch.title === opt ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedMealOption(prev => ({
                              ...prev,
                              [`${currentDayData.day}_lunch`]: opt
                            }));
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="meal-card-footer">
                  <button type="button" className="recipe-prep-cta">
                    <BookOpen size={13} />
                    <span>View Preparation</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dinner */}
            <div 
              className="meal-card-premium glass-panel-interactive"
              onClick={() => handleOpenPreparation(currentMeals.dinner)}
              id="meal-slot-dinner"
            >
              <div className="meal-card-img-wrap">
                <img src={currentMeals.dinner.image} alt={currentMeals.dinner.title} className="meal-card-img" />
                <span className="meal-time-badge">
                  <Moon size={13} /> 08:30 PM
                </span>
                <span className={`slot-diet-indicator ${currentMeals.dinner.dietType}`}></span>
              </div>

              <div className="meal-card-content">
                <div className="meal-card-header">
                  <span className="slot-badge-label">Dinner</span>
                  <div className="card-macros-inline">
                    <span className="macro-pill"><Clock size={11} /> {currentMeals.dinner.time}m</span>
                    <span className="macro-pill text-flame"><Flame size={11} /> {currentMeals.dinner.calories} kcal</span>
                    <span className="macro-pill text-protein"><Dumbbell size={11} /> {currentMeals.dinner.protein}</span>
                  </div>
                </div>

                <h3 className="meal-card-title">{currentMeals.dinner.title}</h3>
                <p className="meal-card-desc">{currentMeals.dinner.description}</p>

                {/* Optional dishes switcher if multiple choices exist */}
                {currentMeals.dinner.options && currentMeals.dinner.options.length > 0 && (
                  <div className="meal-options-box" onClick={e => e.stopPropagation()}>
                    <span className="options-hint">Available Choices:</span>
                    <div className="options-chip-row">
                      {currentMeals.dinner.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`opt-chip ${currentMeals.dinner.title === opt ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedMealOption(prev => ({
                              ...prev,
                              [`${currentDayData.day}_dinner`]: opt
                            }));
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="meal-card-footer">
                  <button type="button" className="recipe-prep-cta">
                    <BookOpen size={13} />
                    <span>View Preparation</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 7-Day Weekly Grid Overview */
        <div className="weekly-grid-layout">
          {activePlanList.map((dayItem, dIdx) => {
            const dateObj = weekDates[dIdx] || { date: '' };
            return (
              <div 
                key={dayItem.day} 
                className={`weekly-day-card glass-panel ${selectedDayIndex === dIdx ? 'active-day-col' : ''}`}
                onClick={() => { setSelectedDayIndex(dIdx); setViewMode('daily'); }}
              >
                <div className="weekly-card-header">
                  <div>
                    <h3>{dayItem.day}</h3>
                    <span className="weekly-date-badge">{dateObj.date}</span>
                  </div>
                  <span className="view-day-link">Open &rarr;</span>
                </div>

                <div className="weekly-day-slots">
                  {['breakfast', 'lunch', 'dinner'].map(slot => {
                    const m = dayItem.meals[slot];
                    return (
                      <div key={slot} className="weekly-slot-mini">
                        <span className="slot-mini-label">{slot}</span>
                        {m ? (
                          <div className="slot-mini-info">
                            <span className="slot-mini-title">{m.title}</span>
                            <span className="slot-mini-cal">{m.calories} kcal</span>
                          </div>
                        ) : (
                          <span className="slot-mini-empty">Empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── RECIPE PREPARATION MODAL (Dataset Guide) ── */}
      {activePreparationRecipe && (
        <div className="modal-backdrop" onClick={() => setActivePreparationRecipe(null)}>
          <div className="prep-modal-card glass-panel" onClick={e => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-icon"
              onClick={() => setActivePreparationRecipe(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Modal Hero Banner */}
            <div className="prep-modal-hero">
              <img src={activePreparationRecipe.image} alt={activePreparationRecipe.title} className="prep-hero-img" />
              <div className="prep-hero-overlay">
                <div className="prep-meta-tags">
                  <span className="tag-cuisine">{activePreparationRecipe.cuisine}</span>
                  <span className="tag-time"><Clock size={12} /> {activePreparationRecipe.time} Mins</span>
                  <span className={`tag-diet ${activePreparationRecipe.dietType}`}>{activePreparationRecipe.dietType.toUpperCase()}</span>
                </div>
                <h2 className="prep-modal-title">{activePreparationRecipe.title}</h2>
                <p className="prep-modal-subtitle">{activePreparationRecipe.subtitle}</p>
              </div>
            </div>

            {/* Dataset Match Badge */}
            <div className="dataset-status-callout">
              <div className="status-callout-icon">
                <Database size={16} />
              </div>
              <div className="status-callout-text">
                <strong>Hugging Face Dataset Status:</strong>
                <span> {activePreparationRecipe.datasetStatus || "Verified in Food Craft Recipe Intelligence System"}</span>
              </div>
            </div>

            {/* Nutrition Highlights Bar */}
            <div className="prep-nutrition-bar">
              <div className="prep-macro-item">
                <span className="p-macro-label">Energy</span>
                <span className="p-macro-val text-flame">{activePreparationRecipe.calories} kcal</span>
              </div>
              <div className="prep-macro-item">
                <span className="p-macro-label">Protein</span>
                <span className="p-macro-val text-protein">{activePreparationRecipe.protein}</span>
              </div>
              <div className="prep-macro-item">
                <span className="p-macro-label">Carbs</span>
                <span className="p-macro-val">{activePreparationRecipe.carbs}</span>
              </div>
              <div className="prep-macro-item">
                <span className="p-macro-label">Fat</span>
                <span className="p-macro-val">{activePreparationRecipe.fat}</span>
              </div>
            </div>

            {/* Modal Body: Ingredients & Instructions */}
            <div className="prep-modal-body">
              {/* Ingredients List */}
              <div className="prep-section">
                <h3 className="prep-section-heading">
                  <Layers size={16} /> Required Ingredients
                </h3>
                <div className="prep-ingredients-grid">
                  {activePreparationRecipe.ingredients.map((ing, i) => (
                    <div key={i} className="prep-ingredient-chip">
                      <span className="ing-bullet">✓</span>
                      <span className="ing-name">{ing.name}</span>
                      <span className="ing-amt">{ing.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Cooking Directions */}
              <div className="prep-section">
                <h3 className="prep-section-heading">
                  <Sparkles size={16} /> Step-by-Step Preparation Directions
                </h3>
                <div className="prep-steps-timeline">
                  {activePreparationRecipe.instructions.map((step, idx) => (
                    <div key={idx} className="prep-step-item">
                      <div className="prep-step-num">{idx + 1}</div>
                      <p className="prep-step-text">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DATASET ANALYSIS REPORT MODAL ── */}
      {showDatasetReport && (
        <div className="modal-backdrop" onClick={() => setShowDatasetReport(false)}>
          <div className="dataset-report-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="report-modal-header">
              <div className="header-left-title">
                <Database size={22} className="text-accent" />
                <div>
                  <h2>Hugging Face Dataset Match Analysis</h2>
                  <p>Repository: <code>Default-Box/recipe_nlg-trim</code> (248,334 indexed recipes)</p>
                </div>
              </div>
              <button type="button" className="modal-close-icon" onClick={() => setShowDatasetReport(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="dataset-report-body">
              <div className="report-metrics-grid">
                <div className="metric-box bg-success-soft">
                  <span className="metric-num">16 Items</span>
                  <span className="metric-label">Found in Hugging Face Dataset</span>
                </div>
                <div className="metric-box bg-warning-soft">
                  <span className="metric-num">24 Items</span>
                  <span className="metric-label">Regional South Indian Specialties</span>
                </div>
              </div>

              <div className="report-section-title">
                <CheckCircle2 size={16} className="text-success" />
                <span>Found in Hugging Face RecipeNLG Dataset:</span>
              </div>
              <div className="report-items-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Your Meal Item</th>
                      <th>Dataset Match Title</th>
                      <th>Found Recipes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Dosa</strong></td>
                      <td>Lace Dosai</td>
                      <td>1 recipe</td>
                    </tr>
                    <tr>
                      <td><strong>Chutney</strong></td>
                      <td>Mango Chutney / Coconut Chutney</td>
                      <td>79 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Vada</strong></td>
                      <td>Vadai</td>
                      <td>4 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Tomato Rice</strong></td>
                      <td>Tomato Rice Soup / Spiced Rice</td>
                      <td>12 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Lemon Rice</strong></td>
                      <td>Lemon Rice</td>
                      <td>11 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Chicken Curry</strong></td>
                      <td>Chicken Curry</td>
                      <td>57 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Chicken Fry</strong></td>
                      <td>Herb Chicken Fry</td>
                      <td>2 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Fish Curry</strong></td>
                      <td>Vegetable Fish Curry</td>
                      <td>2 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Mushroom Curry</strong></td>
                      <td>Mushroom Curry</td>
                      <td>1 recipe</td>
                    </tr>
                    <tr>
                      <td><strong>Chapati</strong></td>
                      <td>Chapati (Soft Rolled Flatbread)</td>
                      <td>3 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Vegetable Curry</strong></td>
                      <td>Vegetable Curry</td>
                      <td>2 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Biryani</strong></td>
                      <td>Masoods' Kheema Biryani</td>
                      <td>2 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Pulav / Pulao</strong></td>
                      <td>Rice Pulao</td>
                      <td>2 recipes</td>
                    </tr>
                    <tr>
                      <td><strong>Curd</strong></td>
                      <td>Lemon Curd</td>
                      <td>20 recipes</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="report-section-title" style={{ marginTop: '1.5rem' }}>
                <AlertCircle size={16} className="text-warning" />
                <span>Regional South Indian Items Missing From RecipeNLG (Supplied by Food Craft Culinary Engine):</span>
              </div>
              <div className="missing-items-tags">
                <span className="missing-tag">Upma</span>
                <span className="missing-tag">Pongal</span>
                <span className="missing-tag">Idli</span>
                <span className="missing-tag">Poori</span>
                <span className="missing-tag">Uggani</span>
                <span className="missing-tag">Bajji (Mirchi Bajji)</span>
                <span className="missing-tag">Pesarattu</span>
                <span className="missing-tag">Sambar Rice / Sambar</span>
                <span className="missing-tag">Full Meals (Rice, Dal, Curd, Rasam, Papadam)</span>
                <span className="missing-tag">Bagara Rice</span>
                <span className="missing-tag">Mutton Biryani</span>
                <span className="missing-tag">Ragi Rice / Ragi Sankati</span>
                <span className="missing-tag">Pulagam</span>
                <span className="missing-tag">Brinjal Curry (Gutti Vankaya)</span>
                <span className="missing-tag">Cluster Beans (Goruchikkudu)</span>
                <span className="missing-tag">Sundal Curry</span>
                <span className="missing-tag">Egg Roast</span>
                <span className="missing-tag">Aloo Fry</span>
                <span className="missing-tag">Cabbage Curry</span>
                <span className="missing-tag">Cauliflower Curry</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
