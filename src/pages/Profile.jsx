// src/pages/Profile.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Flame, Check, LogOut, Utensils
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Profile.css';

export default function Profile() {
  const { userProfile, setUserProfile } = useFoodCraft();
  const navigate = useNavigate();

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [calories, setCalories] = useState(userProfile.dailyCalorieTarget);
  const [proteinTarget, setProteinTarget] = useState(parseInt(userProfile.dailyProteinTarget) || 120);
  const [dietaryPreference, setDietaryPreference] = useState(userProfile.dietaryPreference);
  const [selectedCuisines, setSelectedCuisines] = useState(userProfile.cuisinePreferences || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Health toggles
  const [lowSugar, setLowSugar] = useState(true);
  const [lowSalt, setLowSalt] = useState(false);
  const [gymHighProtein, setGymHighProtein] = useState(true);

  const CUISINE_OPTIONS = [
    "South Indian", "North Indian", "Mediterranean", "Asian Wok", "Italian", "Mexican"
  ];

  const toggleCuisine = (c) => {
    setSelectedCuisines(prev => 
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    setUserProfile(prev => ({
      ...prev,
      name,
      email,
      dailyCalorieTarget: calories,
      dailyProteinTarget: `${proteinTarget}g`,
      dietaryPreference,
      cuisinePreferences: selectedCuisines
    }));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="profile-page page-wrapper">
      {/* Profile Header Card */}
      <div className="profile-hero-card glass-panel animate-fade-in">
        <div className="profile-user-left">
          <img src={userProfile.avatar} alt={userProfile.name} className="profile-main-avatar" />
          <div className="profile-info-text">
            <h1 className="profile-user-name">{name}</h1>
            <span className="profile-user-email">{email}</span>
            <div className="profile-tags-strip">
              <span className="badge badge-match">FoodCraft Pro</span>
              <span className="badge badge-gym">Gym Enthusiast</span>
            </div>
          </div>
        </div>

        <button 
          type="button" 
          className="btn-secondary logout-btn" 
          onClick={handleLogout}
          id="profile-logout-btn"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Settings Form */}
      <form className="profile-settings-form" onSubmit={handleSave}>
        {/* Basic Information */}
        <section className="profile-section glass-panel">
          <div className="section-head-title">
            <Utensils size={20} className="text-primary" />
            <h2>Account Details</h2>
          </div>

          <div className="form-group">
            <label htmlFor="profile-name-input">Display Name</label>
            <input 
              id="profile-name-input" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="auth-select"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-email-input">Email Address</label>
            <input 
              id="profile-email-input" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="auth-select"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-diet-select">Primary Diet Philosophy</label>
            <select
              id="profile-diet-select"
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value)}
              className="auth-select"
            >
              <option value="Flexible (Veg + Egg + Lean Meat)">Flexible (Veg + Egg + Lean Meat)</option>
              <option value="Pure Vegetarian">Strict Pure Vegetarian (No eggs)</option>
              <option value="Eggetarian">Vegetarian with Eggs</option>
              <option value="Non-Vegetarian">Non-Vegetarian Focused</option>
              <option value="Vegan">100% Plant-Based Vegan</option>
            </select>
          </div>
        </section>

        {/* Health & Nutrition Targets */}
        <section className="profile-section glass-panel">
          <div className="section-head-title">
            <Flame size={20} className="text-flame" />
            <h2>Nutrition & Macro Targets</h2>
          </div>

          <div className="sliders-container">
            <div className="slider-group">
              <div className="slider-label-row">
                <label htmlFor="calorie-target-slider">Daily Calorie Target</label>
                <span className="slider-badge">{calories} kcal</span>
              </div>
              <input
                id="calorie-target-slider"
                type="range"
                min="1400"
                max="3500"
                step="50"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="custom-range-slider"
              />
              <div className="range-limits">
                <span>1,400 kcal</span>
                <span>2,400 (Moderate)</span>
                <span>3,500 kcal</span>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <label htmlFor="protein-target-slider">Daily Protein Goal</label>
                <span className="slider-badge text-protein">{proteinTarget}g</span>
              </div>
              <input
                id="protein-target-slider"
                type="range"
                min="50"
                max="220"
                step="5"
                value={proteinTarget}
                onChange={(e) => setProteinTarget(Number(e.target.value))}
                className="custom-range-slider"
              />
              <div className="range-limits">
                <span>50g (Standard)</span>
                <span>120g (Fitness)</span>
                <span>220g (Bodybuilder)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Specialized Health Restrictions */}
        <section className="profile-section glass-panel">
          <div className="section-head-title">
            <Shield size={20} className="text-veg" />
            <h2>Dietary Restrictions & Medical Preferences</h2>
          </div>

          <div className="toggles-list">
            <label className="switch-item">
              <div className="switch-text">
                <span className="switch-title">Low Sugar / Diabetic Friendly</span>
                <span className="switch-sub">Filter out recipes with high glycemic index or &gt;4g added sugar</span>
              </div>
              <input 
                type="checkbox" 
                checked={lowSugar} 
                onChange={(e) => setLowSugar(e.target.checked)} 
              />
            </label>

            <label className="switch-item">
              <div className="switch-text">
                <span className="switch-title">Low Salt / Cardio DASH Diet</span>
                <span className="switch-sub">Limit sodium content to under 300mg per serving</span>
              </div>
              <input 
                type="checkbox" 
                checked={lowSalt} 
                onChange={(e) => setLowSalt(e.target.checked)} 
              />
            </label>

            <label className="switch-item">
              <div className="switch-text">
                <span className="switch-title">Gym & Fitness High-Protein Mode</span>
                <span className="switch-sub">Boost recipes containing 25g+ protein per serving to the top of results</span>
              </div>
              <input 
                type="checkbox" 
                checked={gymHighProtein} 
                onChange={(e) => setGymHighProtein(e.target.checked)} 
              />
            </label>
          </div>
        </section>

        {/* Preferred Cuisines */}
        <section className="profile-section glass-panel">
          <div className="section-head-title">
            <Utensils size={20} className="text-primary" />
            <h2>Regional Cuisine Preferences</h2>
          </div>
          <p className="section-desc-note">Select regional styles you cook most often:</p>

          <div className="cuisines-chips-grid">
            {CUISINE_OPTIONS.map((cuisine) => {
              const selected = selectedCuisines.includes(cuisine);
              return (
                <button
                  key={cuisine}
                  type="button"
                  className={`cuisine-pill-btn ${selected ? 'selected' : ''}`}
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {selected && <Check size={14} />}
                  <span>{cuisine}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Save Bar */}
        <div className="profile-save-bar">
          <button 
            type="submit" 
            className="btn-primary btn-glow save-profile-cta"
            id="save-profile-btn"
          >
            <Check size={18} />
            <span>{savedSuccess ? 'Changes Saved Successfully! ✓' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
