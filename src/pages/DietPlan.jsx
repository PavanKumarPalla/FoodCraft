// src/pages/DietPlan.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Target, 
  TrendingUp, 
  Utensils, 
  Plus, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Clock, 
  Dumbbell, 
  Leaf, 
  Calendar, 
  Menu, 
  Bell, 
  User, 
  X,
  ArrowRight
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './DietPlan.css';

// Pre-built, scientifically formulated diet plans
const PREBUILT_DIET_PLANS = [
  {
    id: "plan-weight-loss",
    name: "Weight Loss Plan",
    tagline: "Calorie deficit with high dietary fiber & lean protein",
    calories: "1200 – 1500 kcal/day",
    goal: "Weight Loss",
    diet: "Vegetarian",
    protein: "75g",
    carbs: "135g",
    fat: "38g",
    badge: "Most Popular",
    color: "#15803d",
    recommendedFoods: ["Quinoa Salads", "Moong Dal Sprouts", "Steamed Veggies", "Oats Khichdi", "Tofu/Paneer"],
    avoidFoods: ["Refined Flour", "Sugary Drinks", "Deep Fried Snacks"]
  },
  {
    id: "plan-muscle-gain",
    name: "Gym Muscle & Power Plan",
    tagline: "High-protein surplus to fuel hypertrophy & athletic recovery",
    calories: "2200 – 2600 kcal/day",
    goal: "Muscle Gain",
    diet: "High Protein",
    protein: "145g",
    carbs: "260g",
    fat: "65g",
    badge: "Athletic Focus",
    color: "#8b5cf6",
    recommendedFoods: ["Chicken Breast", "Egg Whites", "Greek Yogurt", "Brown Rice", "Paneer Tikka"],
    avoidFoods: ["Trans Fats", "Excessive Sodium", "Empty Calorie Sweets"]
  },
  {
    id: "plan-keto",
    name: "Ketogenic Clean Burn Plan",
    tagline: "Very low net-carb & healthy fats to induce metabolic ketosis",
    calories: "1600 – 1900 kcal/day",
    goal: "Fat Loss & Energy",
    diet: "Keto",
    protein: "90g",
    carbs: "25g",
    fat: "130g",
    badge: "Low Carb",
    color: "#ea580c",
    recommendedFoods: ["Avocados", "Ghee & Olive Oil", "Almonds & Walnuts", "Spinach & Paneer", "Grilled Fish"],
    avoidFoods: ["Rice & Wheat", "Potatoes & Root Veg", "Sugar & Sweet Fruits"]
  },
  {
    id: "plan-balanced-veg",
    name: "Pure Vegetarian Balanced Plan",
    tagline: "Nutrient-dense plant-based whole foods for lifelong wellness",
    calories: "1800 – 2000 kcal/day",
    goal: "Balanced Health",
    diet: "Vegetarian",
    protein: "80g",
    carbs: "220g",
    fat: "55g",
    badge: "Plant-Powered",
    color: "#16a34a",
    recommendedFoods: ["Toor & Chana Dal", "Millets & Brown Rice", "Curd & Buttermilk", "Seasonal Veggies", "Nuts"],
    avoidFoods: ["Ultra-Processed Foods", "Artificial Preservatives"]
  },
  {
    id: "plan-diabetic",
    name: "Diabetic & Low-GI Plan",
    tagline: "Low glycemic index complex grains for steady blood sugar control",
    calories: "1400 – 1650 kcal/day",
    goal: "Blood Sugar Control",
    diet: "Diabetic Friendly",
    protein: "85g",
    carbs: "150g",
    fat: "45g",
    badge: "Metabolic Care",
    color: "#0284c7",
    recommendedFoods: ["Ragi (Finger Millet)", "Bitter Gourd", "Fenugreek Sprouts", "Steel-cut Oats", "Lentil Soups"],
    avoidFoods: ["White Rice", "Refined Sugar", "Fruit Juices", "Bakery Goods"]
  },
  {
    id: "plan-mediterranean",
    name: "Mediterranean Heart Health",
    tagline: "Monounsaturated fats, legumes, and antioxidants for longevity",
    calories: "1900 – 2100 kcal/day",
    goal: "Cardiovascular Health",
    diet: "Mediterranean",
    protein: "88g",
    carbs: "205g",
    fat: "68g",
    badge: "Heart Healthy",
    color: "#0d9488",
    recommendedFoods: ["Extra Virgin Olive Oil", "Legumes & Chickpeas", "Tomatoes & Garlic", "Walnuts", "Citrus Greens"],
    avoidFoods: ["Processed Meats", "Refined Oils", "High Fructose Corn Syrup"]
  }
];

// Curated diet-friendly recipes matching goals
const CURATED_DIET_RECIPES = [
  {
    id: "diet-rcp-1",
    title: "Mediterranean Quinoa Salad Bowl",
    calories: 340,
    time: 20,
    protein: "14g",
    dietType: "Vegetarian",
    image: "/images/diet_salad.jpg",
    tags: ["High Fiber", "Low GI", "Weight Loss"]
  },
  {
    id: "diet-rcp-2",
    title: "Paneer Tikka Protein Bowl",
    calories: 420,
    time: 25,
    protein: "28g",
    dietType: "Gym Friendly",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
    tags: ["High Protein", "Muscle Gain", "Keto"]
  },
  {
    id: "diet-rcp-3",
    title: "Spiced Moong Dal Khichdi",
    calories: 320,
    time: 25,
    protein: "13g",
    dietType: "Light & Easy",
    image: "/images/meal_planner_images/rice_dal_carrot.jpg",
    tags: ["Easy Digest", "Balanced", "Diabetic Friendly"]
  },
  {
    id: "diet-rcp-4",
    title: "Herb Grilled Chicken Breast",
    calories: 380,
    time: 25,
    protein: "42g",
    dietType: "Lean Protein",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80",
    tags: ["Zero Sugar", "Muscle Recovery", "Keto"]
  }
];

export default function DietPlan() {
  const { 
    currentUser, 
    userProfile, 
    logActivity, 
    isSidebarOpen, 
    toggleSidebar 
  } = useFoodCraft();
  const navigate = useNavigate();

  // Active Plan States
  const [activePlan, setActivePlan] = useState(() => {
    const saved = localStorage.getItem('foodcraft_active_diet_plan');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return PREBUILT_DIET_PLANS[0];
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(null);

  // Form states for Create Plan
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanGoal, setNewPlanGoal] = useState('Weight Loss');
  const [newPlanCalories, setNewPlanCalories] = useState('1200 - 1500 kcal/day');
  const [newPlanDiet, setNewPlanDiet] = useState('Vegetarian');

  const displayName = currentUser?.name || userProfile?.name || 'Chef';

  const handleSelectPlan = (plan) => {
    setActivePlan(plan);
    try {
      localStorage.setItem('foodcraft_active_diet_plan', JSON.stringify(plan));
    } catch (e) {}

    setShowSuccessToast(`Activated "${plan.name}" as your active plan!`);
    setTimeout(() => setShowSuccessToast(null), 3500);

    if (logActivity) {
      logActivity({
        type: 'diet_plan',
        title: `Switched active diet plan to: ${plan.name}`,
        meta: 'Just now',
        image: '/images/diet_salad.jpg',
        link: '/diet-plan'
      });
    }
  };

  const handleCreatePlanSubmit = (e) => {
    e.preventDefault();
    const finalName = newPlanName.trim() || `${newPlanGoal} Custom Plan`;
    const customPlan = {
      id: `custom-${Date.now()}`,
      name: finalName,
      tagline: `Personalized plan tailored for ${newPlanGoal} and ${newPlanDiet} nutrition`,
      calories: newPlanCalories,
      goal: newPlanGoal,
      diet: newPlanDiet,
      protein: "80g",
      carbs: "180g",
      fat: "45g",
      badge: "Custom Plan",
      color: "#16a34a",
      recommendedFoods: ["Fresh Veggies", "Lean Protein", "Whole Grains", "Antioxidant Greens"],
      avoidFoods: ["Refined Sugars", "Deep Fried Foods"]
    };

    setActivePlan(customPlan);
    try {
      localStorage.setItem('foodcraft_active_diet_plan', JSON.stringify(customPlan));
    } catch (e) {}

    setShowCreateModal(false);
    setNewPlanName('');
    setShowSuccessToast(`Created and activated "${finalName}"!`);
    setTimeout(() => setShowSuccessToast(null), 3500);

    if (logActivity) {
      logActivity({
        type: 'diet_plan',
        title: `Created new diet plan: ${finalName}`,
        meta: 'Just now',
        image: '/images/diet_salad.jpg',
        link: '/diet-plan'
      });
    }
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    const updated = { ...activePlan, goal: newPlanGoal };
    setActivePlan(updated);
    try {
      localStorage.setItem('foodcraft_active_diet_plan', JSON.stringify(updated));
    } catch (e) {}
    setShowGoalModal(false);
    setShowSuccessToast(`Updated diet goal to ${newPlanGoal}!`);
    setTimeout(() => setShowSuccessToast(null), 3500);
  };

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

          {/* Quick link to the separate Daily Meal Planner */}
          <Link to="/meal-planner" className="top-meal-planner-pill" title="Open Daily Meal Planner">
            <Calendar size={15} />
            <span>Daily Meal Planner</span>
            <ArrowRight size={14} />
          </Link>

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

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="diet-toast-message">
            <Check size={18} />
            <span>{showSuccessToast}</span>
          </div>
        )}

        {/* Hero Banner matching Referral Design 3 */}
        <div className="diet-hero-banner">
          <div className="diet-hero-info">
            <div className="diet-leaf-badge">
              <span className="diet-leaf-emoji">🥗</span>
            </div>
            <div>
              <h1 className="diet-hero-title">Your Diet Plan</h1>
              <p className="diet-hero-subtitle">Eat healthy. Live better. Tailored specifically to your bodily nutritional goals.</p>
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

              <h2 className="active-plan-name">{activePlan.name}</h2>
              <span className="active-plan-calories">{activePlan.calories}</span>

              <div className="plan-macro-tags">
                <span className="macro-tag">🥩 {activePlan.protein} Protein</span>
                <span className="macro-tag">🌾 {activePlan.carbs} Carbs</span>
                <span className="macro-tag">🥑 {activePlan.fat} Fats</span>
              </div>

              <button 
                className="btn-view-plan-details"
                onClick={() => {
                  const catalogElem = document.getElementById('diet-catalog-section');
                  if (catalogElem) catalogElem.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>View Diet Options</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Healthy Silhouette Wellness Graphic */}
            <div className="active-plan-figure-graphic">
              <svg viewBox="0 0 100 150" className="figure-svg" fill="none">
                <circle cx="50" cy="14" r="10" fill="#22c55e" />
                <path 
                  d="M44 28 C40 36 38 46 41 58 C43 64 42 74 39 84 C37 94 38 106 41 120 L38 148 C40 150 43 150 45 149 L47 114 L53 114 L55 149 C57 150 60 150 62 148 L59 120 C62 106 63 94 61 84 C58 74 57 64 59 58 C62 46 60 36 56 28 C53 25 47 25 44 28 Z" 
                  fill="url(#figureGreenGrad)" 
                />
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

            <div className="overview-details-box">
              <div className="overview-detail-row">
                <span>Preference:</span>
                <strong>{activePlan.diet}</strong>
              </div>
              <div className="overview-detail-row">
                <span>Target Intake:</span>
                <strong>{activePlan.calories}</strong>
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
              <span className="goal-name-text">{activePlan.goal}</span>

              <button 
                className="btn-edit-goal"
                onClick={() => { setNewPlanGoal(activePlan.goal); setShowGoalModal(true); }}
              >
                <span>Edit Goal</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Banner CTA to switch to Daily Meal Planner */}
        <div className="meal-planner-callout-banner">
          <div className="callout-content">
            <div className="callout-icon-wrap">
              <Calendar size={28} className="text-forest-green" />
            </div>
            <div>
              <h3>Daily Meal Planner Schedule</h3>
              <p>Looking for your 7-day culinary timetable with breakfast, lunch, and dinner recipe choices?</p>
            </div>
          </div>
          <Link to="/meal-planner" className="btn-callout-action">
            <span>Open Daily Meal Planner</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Curated Diet Plans Catalog */}
        <div className="diet-catalog-section" id="diet-catalog-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Explore Scientific Diet Plans</h2>
              <p className="section-subtitle">Select any dietary framework to instantly adapt your calorie benchmarks and recommendations</p>
            </div>
          </div>

          <div className="diet-plans-grid">
            {PREBUILT_DIET_PLANS.map((plan) => {
              const isActive = activePlan.name === plan.name;
              return (
                <div key={plan.id} className={`diet-plan-item-card ${isActive ? 'selected-plan' : ''}`}>
                  <div className="plan-item-top">
                    <span className="plan-badge-pill" style={{ color: plan.color, background: `${plan.color}15` }}>
                      {plan.badge}
                    </span>
                    {isActive && (
                      <span className="active-tag-chip">
                        <Check size={12} /> Active
                      </span>
                    )}
                  </div>

                  <h3 className="plan-item-title">{plan.name}</h3>
                  <p className="plan-item-tagline">{plan.tagline}</p>

                  <div className="plan-item-specs">
                    <div className="spec-item">
                      <span className="spec-label">Target Calories</span>
                      <strong className="spec-val calories-val">{plan.calories}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Primary Goal</span>
                      <strong className="spec-val">{plan.goal}</strong>
                    </div>
                  </div>

                  <div className="plan-macros-row">
                    <div className="macro-chip">🥩 <span>{plan.protein}</span> Prot</div>
                    <div className="macro-chip">🌾 <span>{plan.carbs}</span> Carbs</div>
                    <div className="macro-chip">🥑 <span>{plan.fat}</span> Fat</div>
                  </div>

                  <div className="food-suggestions-box">
                    <div className="food-group">
                      <span className="group-label text-green">✓ Recommended:</span>
                      <span className="group-items">{plan.recommendedFoods.join(', ')}</span>
                    </div>
                    <div className="food-group">
                      <span className="group-label text-red">✕ Limit:</span>
                      <span className="group-items">{plan.avoidFoods.join(', ')}</span>
                    </div>
                  </div>

                  <div className="plan-card-footer">
                    {isActive ? (
                      <button className="btn-plan-active" disabled>
                        <Check size={16} />
                        <span>Currently Active</span>
                      </button>
                    ) : (
                      <button 
                        className="btn-select-plan"
                        onClick={() => handleSelectPlan(plan)}
                      >
                        <span>Activate This Plan</span>
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curated Diet Recipes Section */}
        <div className="curated-diet-recipes-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Curated Recipes For {activePlan.name}</h2>
              <p className="section-subtitle">Delicious high-nutrition dishes matching your active daily targets</p>
            </div>
            <Link to="/recipes?filter=diet" className="view-all-recipes-link">
              <span>View More Recipes</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="diet-recipes-grid">
            {CURATED_DIET_RECIPES.map((r) => (
              <div 
                key={r.id} 
                className="diet-recipe-card"
                onClick={() => navigate('/recipes')}
              >
                <div className="recipe-card-img-wrap">
                  <img src={r.image} alt={r.title} className="recipe-card-img" />
                  <span className="recipe-cal-badge">{r.calories} kcal</span>
                </div>
                <div className="recipe-card-content">
                  <div className="recipe-meta-tags">
                    {r.tags.map(t => (
                      <span key={t} className="recipe-tag-pill">{t}</span>
                    ))}
                  </div>
                  <h4 className="recipe-card-title">{r.title}</h4>
                  <div className="recipe-card-specs">
                    <span><Clock size={14} /> {r.time} mins</span>
                    <span><Dumbbell size={14} /> {r.protein} Protein</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create New Plan Modal */}
      {showCreateModal && (
        <div className="diet-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="diet-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Custom Diet Plan</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePlanSubmit} className="modal-body">
              <div className="form-group">
                <label>Plan Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Clean Energy Routine" 
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  className="modal-text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Health Goal</label>
                <select 
                  value={newPlanGoal}
                  onChange={e => setNewPlanGoal(e.target.value)}
                  className="modal-select-input"
                >
                  <option value="Weight Loss">Weight Loss (Caloric Deficit)</option>
                  <option value="Muscle Gain">Muscle Gain (High Protein)</option>
                  <option value="Balanced Health">Balanced Health & Longevity</option>
                  <option value="Blood Sugar Control">Blood Sugar Control (Low GI)</option>
                  <option value="Heart Health">Cardiovascular Heart Health</option>
                </select>
              </div>

              <div className="form-group">
                <label>Daily Calorie Target</label>
                <select 
                  value={newPlanCalories}
                  onChange={e => setNewPlanCalories(e.target.value)}
                  className="modal-select-input"
                >
                  <option value="1200 - 1400 kcal/day">1200 - 1400 kcal/day (Intense Cut)</option>
                  <option value="1400 - 1600 kcal/day">1400 - 1600 kcal/day (Moderate Deficit)</option>
                  <option value="1800 - 2000 kcal/day">1800 - 2000 kcal/day (Maintenance)</option>
                  <option value="2200 - 2500 kcal/day">2200 - 2500 kcal/day (Lean Bulk)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dietary Preference</label>
                <select 
                  value={newPlanDiet}
                  onChange={e => setNewPlanDiet(e.target.value)}
                  className="modal-select-input"
                >
                  <option value="Vegetarian">Pure Vegetarian</option>
                  <option value="Vegan">Vegan (Plant Based)</option>
                  <option value="High Protein">High Protein Non-Veg / Mixed</option>
                  <option value="Keto">Keto (Low Carb)</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save">
                  Save & Activate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showGoalModal && (
        <div className="diet-modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="diet-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Diet Health Goal</h3>
              <button className="modal-close" onClick={() => setShowGoalModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleGoalSubmit} className="modal-body">
              <div className="form-group">
                <label>Select Target Goal</label>
                <select 
                  value={newPlanGoal}
                  onChange={e => setNewPlanGoal(e.target.value)}
                  className="modal-select-input"
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Gain">Muscle Gain</option>
                  <option value="Balanced Health">Balanced Health</option>
                  <option value="Blood Sugar Control">Blood Sugar Control</option>
                  <option value="Heart Health">Cardiovascular Health</option>
                  <option value="Athletic Endurance">Athletic Endurance</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
