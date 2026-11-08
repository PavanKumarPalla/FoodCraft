// src/pages/MealPlanner.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Coffee, Sun, Moon, 
  ChevronRight, BookOpen, 
  X, Heart, TrendingUp, Utensils, Target, Plus,
  Bell, User, Menu, Check
} from 'lucide-react';
import { 
  SOUTH_INDIAN_7_DAY_PLAN, 
  NORTH_INDIAN_7_DAY_PLAN, 
  SOUTH_INDIAN_RECIPES,
  getDynamicWeekDates 
} from '../data/mealPlanData';
import { useFoodCraft } from '../context/FoodCraftContext';
import './MealPlanner.css';

export default function MealPlanner() {
  const { currentUser, userProfile, logActivity, isSidebarOpen, toggleSidebar } = useFoodCraft();

  // Active Plan States
  const [activePlanName, setActivePlanName] = useState('Weight Loss Plan');
  const [activePlanCalories, setActivePlanCalories] = useState('1200 – 1500 kcal/day');
  const [activePlanGoal, setActivePlanGoal] = useState('Weight Loss');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanGoal, setNewPlanGoal] = useState('Weight Loss');
  const [newPlanCalories, setNewPlanCalories] = useState('1200 - 1500 kcal/day');
  const [newPlanDiet, setNewPlanDiet] = useState('Vegetarian');

  const [cuisineRegion, setCuisineRegion] = useState('south'); // 'south' | 'north'
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
  const [activePreparationRecipe, setActivePreparationRecipe] = useState(null);
  const [selectedMealOption] = useState({});

  // Dynamic week dates
  const weekDates = useMemo(() => getDynamicWeekDates(), []);

  // Determine active plan based on cuisine region
  const activePlanList = useMemo(() => {
    return cuisineRegion === 'south' ? SOUTH_INDIAN_7_DAY_PLAN : NORTH_INDIAN_7_DAY_PLAN;
  }, [cuisineRegion]);

  // Helper to get active meal object
  const getMealData = (dayIndex, slot) => {
    const day = activePlanList[dayIndex] || activePlanList[0];
    const baseMeal = day?.meals?.[slot];
    if (!baseMeal) return null;

    const optKey = `${dayIndex}_${slot}`;
    const chosenOptionName = selectedMealOption[optKey];

    if (chosenOptionName && baseMeal.options && baseMeal.options.length > 0) {
      const match = baseMeal.options.find(o => o.title === chosenOptionName);
      if (match) {
        return {
          ...baseMeal,
          title: match.title,
          image: match.image || baseMeal.image,
          time: match.time || baseMeal.time,
          calories: match.calories || baseMeal.calories,
          protein: match.protein || baseMeal.protein,
          carbs: match.carbs || baseMeal.carbs,
          fat: match.fat || baseMeal.fat,
          dietType: match.dietType || baseMeal.dietType,
          description: match.description || baseMeal.description
        };
      }
    }
    return baseMeal;
  };

  const currentMeals = {
    breakfast: getMealData(selectedDayIndex, 'breakfast'),
    lunch: getMealData(selectedDayIndex, 'lunch'),
    dinner: getMealData(selectedDayIndex, 'dinner')
  };

  const totalCalories = (currentMeals.breakfast?.calories || 0) +
    (currentMeals.lunch?.calories || 0) +
    (currentMeals.dinner?.calories || 0);

  const totalProtein = (parseInt(currentMeals.breakfast?.protein) || 0) +
    (parseInt(currentMeals.lunch?.protein) || 0) +
    (parseInt(currentMeals.dinner?.protein) || 0);

  const totalCarbs = (parseInt(currentMeals.breakfast?.carbs) || 0) +
    (parseInt(currentMeals.lunch?.carbs) || 0) +
    (parseInt(currentMeals.dinner?.carbs) || 0);

  const totalFat = (parseInt(currentMeals.breakfast?.fat) || 0) +
    (parseInt(currentMeals.lunch?.fat) || 0) +
    (parseInt(currentMeals.dinner?.fat) || 0);

  const handleSelectOption = (dayIndex, slot, optTitle, e) => {
    if (e) e.stopPropagation();
    setSelectedMealOption(prev => ({
      ...prev,
      [`${dayIndex}_${slot}`]: optTitle
    }));
  };

  const handleOpenPreparation = (meal) => {
    if (!meal) return;
    const recipeId = meal.id;
    let recipeDetails = SOUTH_INDIAN_RECIPES[recipeId];

    if (!recipeDetails) {
      recipeDetails = {
        title: meal.title,
        description: meal.description || "Authentic freshly prepared nutritious balanced meal.",
        time: meal.time || 25,
        calories: meal.calories || 420,
        protein: meal.protein || "14g",
        carbs: meal.carbs || "68g",
        fat: meal.fat || "12g",
        datasetStatus: "Authentic Culinary Guide",
        ingredients: [
          { name: "Main Grains / Rice / Wheat", amount: "1.5 cups" },
          { name: "Lentils / Dal / Protein", amount: "1 cup" },
          { name: "Seasoning & Spices (Mustard, Cumin, Curry Leaves)", amount: "1 tbsp" },
          { name: "Fresh Produce / Vegetables", amount: "1.5 cups" },
          { name: "Ghee / Healthy Cooking Oil", amount: "1.5 tbsp" }
        ],
        instructions: [
          "Wash and prepare the fresh vegetables, grains, and protein components.",
          "Heat oil or ghee in a pan; temper with mustard seeds, cumin, and curry leaves.",
          "Add aromatics (onions, ginger, garlic, green chilies) and sauté until golden.",
          "Incorporate spices, salt, and water; cook covered on medium-low flame until tender.",
          "Finish with fresh coriander leaves, a squeeze of lemon or a dollop of ghee, and serve hot."
        ]
      };
    }
    setActivePreparationRecipe(recipeDetails);
  };

  const handleCreatePlanSubmit = (e) => {
    e.preventDefault();
    const finalName = newPlanName.trim() || `${newPlanGoal} Plan`;
    setActivePlanName(finalName);
    setActivePlanGoal(newPlanGoal);
    setActivePlanCalories(newPlanCalories);
    setShowCreateModal(false);

    if (logActivity) {
      logActivity({
        type: 'diet_plan',
        title: `Added to diet plan: ${finalName}`,
        meta: 'Just now',
        image: '/images/diet_salad.jpg',
        link: '/meal-plan'
      });
    }
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    setActivePlanGoal(newPlanGoal);
    setShowGoalModal(false);
  };

  const displayName = currentUser?.name || userProfile?.name || 'User';

  return (
    <div className="referral-page-layout diet-page-container">
      {/* Main Right Content */}
      <div className="referral-main-content">
        {/* Top bar with hamburger toggle and notification/user icons */}
        <div className="referral-top-bar">
          <button 
            className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={toggleSidebar}
            aria-label="Toggle Navigation Sidebar"
            title={isSidebarOpen ? "Close Navigation Sidebar" : "Open Navigation Sidebar"}
            id="diet-sidebar-toggle-btn"
          >
            <Menu size={22} />
          </button>

          <div className="referral-top-actions">
            <button className="top-notif-btn" title="Notifications">
              <Bell size={20} />
              <span className="notif-counter-bubble">2</span>
            </button>

            <Link to="/profile" className="top-avatar-circle" title={`Signed in as ${displayName}`}>
              <User size={20} />
            </Link>
          </div>
        </div>

        {/* Hero Banner matching Image 3 */}
        <div className="diet-hero-banner">
          <div className="diet-hero-info">
            <div className="diet-leaf-badge">
              <span className="diet-leaf-emoji">🍃</span>
            </div>
            <div>
              <h1 className="diet-hero-title">Your Diet Plan</h1>
              <p className="diet-hero-subtitle">Eat healthy. Live better.</p>
            </div>
          </div>

          <div className="diet-hero-actions">
            <button 
              className="btn-create-plan"
              onClick={() => setShowCreateModal(true)}
              id="btn-create-new-plan"
            >
              <Plus size={18} />
              <span>Create New Plan</span>
            </button>

            <div className="diet-hero-salad-wrap">
              <img 
                src="/images/diet_salad.jpg" 
                alt="Healthy Diet Salad" 
                className="diet-hero-salad-img"
              />
            </div>
          </div>
        </div>

        {/* 3 Referral Cards: Active Plan, Plan Overview, Diet Goals */}
        <div className="diet-cards-grid">
          {/* Card 1: Active Plan */}
          <div className="diet-card active-plan-card">
            <div className="active-plan-content">
              <div className="active-status-badge">
                <Check size={14} className="check-icon" />
                <span>Active Plan</span>
              </div>

              <h2 className="active-plan-name">{activePlanName}</h2>
              <span className="active-plan-calories">{activePlanCalories}</span>

              <button 
                className="btn-view-plan-details"
                onClick={() => {
                  const scheduleElem = document.getElementById('diet-weekly-schedule-anchor');
                  if (scheduleElem) scheduleElem.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>View Plan Details</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Healthy Silhouette Wellness Graphic */}
            <div className="active-plan-figure-graphic">
              <svg viewBox="0 0 100 150" className="figure-svg" fill="none">
                {/* Silhouette Figure */}
                <circle cx="50" cy="14" r="10" fill="#22c55e" />
                <path 
                  d="M44 28 C40 36 38 46 41 58 C43 64 42 74 39 84 C37 94 38 106 41 120 L38 148 C40 150 43 150 45 149 L47 114 L53 114 L55 149 C57 150 60 150 62 148 L59 120 C62 106 63 94 61 84 C58 74 57 64 59 58 C62 46 60 36 56 28 C53 25 47 25 44 28 Z" 
                  fill="url(#figureGreenGrad)" 
                />
                {/* Leaves around silhouette */}
                <path d="M28 118 C22 108 18 114 20 128 C25 128 27 124 28 118 Z" fill="#86efac" />
                <path d="M72 112 C79 104 84 110 80 125 C75 124 73 118 72 112 Z" fill="#4ade80" />
                <path d="M68 85 C76 80 80 88 74 98 C70 96 69 90 68 85 Z" fill="#bbf7d0" />
                <defs>
                  <linearGradient id="figureGreenGrad" x1="50" y1="4" x2="50" y2="150" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4ade80" />
                    <stop offset="0.6" stopColor="#22c55e" />
                    <stop offset="1" stopColor="#15803d" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card 2: Plan Overview */}
          <div className="diet-card plan-overview-card">
            <h3 className="card-section-title">Plan Overview</h3>

            <div className="overview-items-row">
              <div className="overview-item">
                <div className="overview-icon-circle">
                  <Utensils size={24} className="text-forest-green" />
                </div>
                <span className="overview-item-label">3 Meals</span>
                <span className="overview-item-sub">+ Snacks</span>
              </div>

              <div className="overview-item">
                <div className="overview-icon-circle">
                  <Heart size={24} className="text-forest-green" />
                </div>
                <span className="overview-item-label">Balanced</span>
                <span className="overview-item-sub">Nutrition</span>
              </div>

              <div className="overview-item">
                <div className="overview-icon-circle">
                  <TrendingUp size={24} className="text-forest-green" />
                </div>
                <span className="overview-item-label">Track</span>
                <span className="overview-item-sub">Progress</span>
              </div>
            </div>
          </div>

          {/* Card 3: Diet Goals */}
          <div className="diet-card diet-goals-card">
            <h3 className="card-section-title">Diet Goals</h3>

            <div className="goals-center-content">
              <div className="goal-target-circle">
                <Target size={38} className="text-target-red" />
              </div>
              <span className="goal-name-text">{activePlanGoal}</span>

              <button 
                className="btn-edit-goal"
                onClick={() => { setNewPlanGoal(activePlanGoal); setShowGoalModal(true); }}
              >
                <span>Edit Goal</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Meal Schedule Header */}
        <div className="diet-schedule-section" id="diet-weekly-schedule-anchor">
          <div className="schedule-header-row">
            <div>
              <h2 className="schedule-title">7-Day Culinary Routine</h2>
              <p className="schedule-subtitle">Handcrafted breakfast, lunch, and dinner recipes tailored to your nutrition</p>
            </div>

            <div className="schedule-controls">
              {/* Regional selector */}
              <div className="cuisine-toggle-pill">
                <button 
                  className={`region-pill-btn ${cuisineRegion === 'south' ? 'active' : ''}`}
                  onClick={() => { setCuisineRegion('south'); setSelectedDayIndex(0); }}
                >
                  South Indian
                </button>
                <button 
                  className={`region-pill-btn ${cuisineRegion === 'north' ? 'active' : ''}`}
                  onClick={() => { setCuisineRegion('north'); setSelectedDayIndex(0); }}
                >
                  North Indian
                </button>
              </div>

              {/* View mode toggle */}
              <div className="view-mode-pill">
                <button 
                  className={`mode-btn ${viewMode === 'daily' ? 'active' : ''}`}
                  onClick={() => setViewMode('daily')}
                >
                  Daily
                </button>
                <button 
                  className={`mode-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                  onClick={() => setViewMode('weekly')}
                >
                  7-Day Grid
                </button>
              </div>
            </div>
          </div>

          {/* 7 Day Pills */}
          <div className="day-pills-bar">
            {weekDates.map((dayItem, idx) => (
              <button
                key={dayItem.day}
                className={`schedule-day-pill ${selectedDayIndex === idx ? 'active' : ''}`}
                onClick={() => setSelectedDayIndex(idx)}
              >
                <span className="pill-day-label">{dayItem.day.slice(0, 3)}</span>
                <span className="pill-date-label">{dayItem.date}</span>
                {dayItem.isToday && <span className="pill-today-dot" title="Today" />}
              </button>
            ))}
          </div>

          {/* Daily View Slots */}
          {viewMode === 'daily' ? (
            <div className="daily-schedule-layout">
              {/* Daily Macro Bar */}
              <div className="daily-macro-strip">
                <div className="macro-strip-item">
                  <span className="strip-label">Daily Calories</span>
                  <span className="strip-value strip-calories">{totalCalories} kcal</span>
                </div>
                <div className="macro-strip-item">
                  <span className="strip-label">Protein</span>
                  <span className="strip-value strip-protein">{totalProtein}g</span>
                </div>
                <div className="macro-strip-item">
                  <span className="strip-label">Carbs</span>
                  <span className="strip-value">{totalCarbs}g</span>
                </div>
                <div className="macro-strip-item">
                  <span className="strip-label">Healthy Fats</span>
                  <span className="strip-value">{totalFat}g</span>
                </div>
              </div>

              {/* 3 Main Meals Cards */}
              <div className="meals-cards-grid">
                {/* Breakfast */}
                <div 
                  className="meal-slot-card"
                  onClick={() => handleOpenPreparation(currentMeals.breakfast)}
                >
                  <div className="meal-slot-image-wrap">
                    <img 
                      src={currentMeals.breakfast?.image || "/images/diet_salad.jpg"} 
                      alt={currentMeals.breakfast?.title} 
                      className="meal-slot-image"
                    />
                    <span className="meal-time-tag">
                      <Coffee size={13} /> 08:30 AM
                    </span>
                  </div>

                  <div className="meal-slot-body">
                    <div className="slot-badge-row">
                      <span className="meal-type-chip">Breakfast</span>
                      <span className="meal-cal-chip">{currentMeals.breakfast?.calories} kcal</span>
                    </div>

                    <h4 className="meal-title">{currentMeals.breakfast?.title}</h4>
                    <p className="meal-desc">{currentMeals.breakfast?.description}</p>

                    <div className="meal-action-footer">
                      <button className="btn-view-steps">
                        <BookOpen size={14} />
                        <span>Cooking Recipe</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lunch */}
                <div 
                  className="meal-slot-card"
                  onClick={() => handleOpenPreparation(currentMeals.lunch)}
                >
                  <div className="meal-slot-image-wrap">
                    <img 
                      src={currentMeals.lunch?.image || "/images/diet_salad.jpg"} 
                      alt={currentMeals.lunch?.title} 
                      className="meal-slot-image"
                    />
                    <span className="meal-time-tag">
                      <Sun size={13} /> 01:15 PM
                    </span>
                  </div>

                  <div className="meal-slot-body">
                    <div className="slot-badge-row">
                      <span className="meal-type-chip">Lunch</span>
                      <span className="meal-cal-chip">{currentMeals.lunch?.calories} kcal</span>
                    </div>

                    <h4 className="meal-title">{currentMeals.lunch?.title}</h4>
                    <p className="meal-desc">{currentMeals.lunch?.description}</p>

                    <div className="meal-action-footer">
                      <button className="btn-view-steps">
                        <BookOpen size={14} />
                        <span>Cooking Recipe</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dinner */}
                <div 
                  className="meal-slot-card"
                  onClick={() => handleOpenPreparation(currentMeals.dinner)}
                >
                  <div className="meal-slot-image-wrap">
                    <img 
                      src={currentMeals.dinner?.image || "/images/diet_salad.jpg"} 
                      alt={currentMeals.dinner?.title} 
                      className="meal-slot-image"
                    />
                    <span className="meal-time-tag">
                      <Moon size={13} /> 08:00 PM
                    </span>
                  </div>

                  <div className="meal-slot-body">
                    <div className="slot-badge-row">
                      <span className="meal-type-chip">Dinner</span>
                      <span className="meal-cal-chip">{currentMeals.dinner?.calories} kcal</span>
                    </div>

                    <h4 className="meal-title">{currentMeals.dinner?.title}</h4>
                    <p className="meal-desc">{currentMeals.dinner?.description}</p>

                    <div className="meal-action-footer">
                      <button className="btn-view-steps">
                        <BookOpen size={14} />
                        <span>Cooking Recipe</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Weekly 7-Day Grid View */
            <div className="weekly-schedule-grid">
              {activePlanList.map((dayItem, dIdx) => (
                <div key={dayItem.day} className="weekly-day-card">
                  <div className="weekly-day-header">
                    <span className="weekly-day-name">{dayItem.day}</span>
                    <span className="weekly-day-date">{weekDates[dIdx]?.date}</span>
                  </div>
                  <div className="weekly-meals-stack">
                    {['breakfast', 'lunch', 'dinner'].map((slot) => {
                      const m = getMealData(dIdx, slot);
                      return (
                        <div 
                          key={slot} 
                          className="weekly-meal-row"
                          onClick={() => handleOpenPreparation(m)}
                        >
                          <img 
                            src={m?.image || "/images/diet_salad.jpg"} 
                            alt={m?.title} 
                            className="weekly-meal-thumb"
                          />
                          <div className="weekly-meal-info">
                            <span className="slot-tag-small">{slot}</span>
                            <span className="weekly-meal-title">{m?.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipe Preparation Modal */}
      {activePreparationRecipe && (
        <div className="diet-modal-overlay" onClick={() => setActivePreparationRecipe(null)}>
          <div className="diet-modal-card" onClick={e => e.stopPropagation()}>
            <div className="diet-modal-header">
              <div>
                <span className="modal-chip">Chef Preparation Guide</span>
                <h2 className="diet-modal-title">{activePreparationRecipe.title}</h2>
              </div>
              <button 
                className="diet-modal-close"
                onClick={() => setActivePreparationRecipe(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="diet-modal-body">
              <div className="modal-macros-row">
                <div className="modal-macro-box">
                  <span className="m-val">{activePreparationRecipe.calories} kcal</span>
                  <span className="m-lbl">Calories</span>
                </div>
                <div className="modal-macro-box">
                  <span className="m-val">{activePreparationRecipe.protein}</span>
                  <span className="m-lbl">Protein</span>
                </div>
                <div className="modal-macro-box">
                  <span className="m-val">{activePreparationRecipe.carbs}</span>
                  <span className="m-lbl">Carbs</span>
                </div>
                <div className="modal-macro-box">
                  <span className="m-val">{activePreparationRecipe.time} mins</span>
                  <span className="m-lbl">Cook Time</span>
                </div>
              </div>

              <div className="modal-section">
                <h3>Ingredients</h3>
                <ul className="modal-ing-list">
                  {activePreparationRecipe.ingredients?.map((ing, idx) => (
                    <li key={idx}>
                      <span className="ing-name">{ing.name}</span>
                      <span className="ing-amt">{ing.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="modal-section">
                <h3>Instructions</h3>
                <ol className="modal-steps-list">
                  {activePreparationRecipe.instructions?.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-num">{idx + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Plan Modal */}
      {showCreateModal && (
        <div className="diet-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="diet-modal-card modal-small" onClick={e => e.stopPropagation()}>
            <div className="diet-modal-header">
              <div>
                <span className="modal-chip">Custom Plan</span>
                <h2 className="diet-modal-title">Create New Diet Plan</h2>
              </div>
              <button className="diet-modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="diet-modal-form">
              <div className="form-group">
                <label>Plan Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Weight Loss Plan, Muscle Gain 2000" 
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="diet-form-input"
                />
              </div>

              <div className="form-group">
                <label>Primary Health Goal</label>
                <select 
                  value={newPlanGoal}
                  onChange={(e) => setNewPlanGoal(e.target.value)}
                  className="diet-form-select"
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Gain">Muscle Gain (High Protein)</option>
                  <option value="Balanced Health">Balanced Health & Wellness</option>
                  <option value="Heart Healthy">Heart Healthy (Low Sodium)</option>
                  <option value="Keto / Low-Carb">Keto / Low-Carb</option>
                </select>
              </div>

              <div className="form-group">
                <label>Daily Calorie Target</label>
                <select 
                  value={newPlanCalories}
                  onChange={(e) => setNewPlanCalories(e.target.value)}
                  className="diet-form-select"
                >
                  <option value="1200 – 1500 kcal/day">1200 – 1500 kcal/day (Weight Loss)</option>
                  <option value="1500 – 1800 kcal/day">1500 – 1800 kcal/day (Moderate Deficit)</option>
                  <option value="1800 – 2200 kcal/day">1800 – 2200 kcal/day (Maintenance / Balanced)</option>
                  <option value="2200 – 2600 kcal/day">2200 – 2600 kcal/day (Active Muscle Building)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dietary Style</label>
                <select 
                  value={newPlanDiet}
                  onChange={(e) => setNewPlanDiet(e.target.value)}
                  className="diet-form-select"
                >
                  <option value="Vegetarian">Pure Vegetarian</option>
                  <option value="Eggetarian">Vegetarian + Eggs</option>
                  <option value="Non-Vegetarian">Non-Vegetarian (Chicken, Fish, Meat)</option>
                  <option value="Vegan">100% Plant-Based Vegan</option>
                </select>
              </div>

              <button type="submit" className="btn-modal-primary">
                Activate Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showGoalModal && (
        <div className="diet-modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="diet-modal-card modal-small" onClick={e => e.stopPropagation()}>
            <div className="diet-modal-header">
              <div>
                <span className="modal-chip">Goal Tracker</span>
                <h2 className="diet-modal-title">Edit Diet Goal</h2>
              </div>
              <button className="diet-modal-close" onClick={() => setShowGoalModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleGoalSubmit} className="diet-modal-form">
              <div className="form-group">
                <label>Select Your Health Focus</label>
                <select 
                  value={newPlanGoal}
                  onChange={(e) => setNewPlanGoal(e.target.value)}
                  className="diet-form-select"
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Gain">Muscle Gain / Gym Performance</option>
                  <option value="Balanced Health">Balanced Health & Vitality</option>
                  <option value="Low Sugar / Diabetes Friendly">Low Sugar / Diabetes Friendly</option>
                  <option value="Cardio Fitness">Cardio & Heart Health</option>
                </select>
              </div>

              <button type="submit" className="btn-modal-primary">
                Save Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
