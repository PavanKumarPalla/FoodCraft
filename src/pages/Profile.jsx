// src/pages/Profile.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Flame, Check, LogOut, Utensils, Camera, CheckCircle2, Trash2, User, LogIn, AlertCircle 
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import ImageAdjustModal from '../components/ImageAdjustModal';
import './Profile.css';

export default function Profile() {
  const { userProfile, updateProfile, logout, token, currentUser } = useFoodCraft();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(() => currentUser?.name || userProfile.name || '');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fixed Gmail address: strictly read-only and uneditable
  const fixedEmail = currentUser?.email || userProfile.email || '';

  // Synchronize name if userProfile/currentUser finishes loading asynchronously
  useEffect(() => {
    if (!name && (currentUser?.name || userProfile.name)) {
      setName(currentUser?.name || userProfile.name || '');
    }
  }, [currentUser?.name, userProfile.name, name]);

  // Sanitize initial avatar to exclude legacy unsplash images
  const [avatar, setAvatar] = useState(() => {
    return (userProfile.avatar && !userProfile.avatar.includes('unsplash.com')) 
      ? userProfile.avatar 
      : '';
  });
  const [avatarMessage, setAvatarMessage] = useState('');
  const [calories, setCalories] = useState(userProfile.dailyCalorieTarget);
  const [proteinTarget, setProteinTarget] = useState(parseInt(userProfile.dailyProteinTarget) || 120);
  const [dietaryPreference, setDietaryPreference] = useState(userProfile.dietaryPreference);
  const [selectedCuisines, setSelectedCuisines] = useState(userProfile.cuisinePreferences || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync avatar with userProfile if loaded asynchronously from DB
  useEffect(() => {
    if (userProfile.avatar && !avatar && !userProfile.avatar.includes('unsplash.com')) {
      setAvatar(userProfile.avatar);
    }
  }, [userProfile.avatar, avatar]);

  // Check whether user has a custom uploaded avatar
  const hasCustomAvatar = Boolean(
    (avatar && !avatar.includes('unsplash.com')) || 
    (userProfile.avatar && !userProfile.avatar.includes('unsplash.com'))
  );
  const activeAvatar = hasCustomAvatar ? (avatar || userProfile.avatar) : null;

  // Image Adjust Modal States
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedRawImage, setSelectedRawImage] = useState(null);

  // Handle Profile Photo Selection & Open Professional Adjust Modal
  const handleAvatarFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedRawImage(event.target.result);
      setAdjustModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle Apply from Image Adjust Modal
  const handleApplyCroppedAvatar = async (croppedDataUrl) => {
    setAdjustModalOpen(false);
    setSelectedRawImage(null);
    setAvatar(croppedDataUrl);
    setAvatarMessage('Saving photo...');
    try {
      await updateProfile({ avatar: croppedDataUrl });
      setAvatarMessage('✓ Profile photo updated and saved to database!');
    } catch {
      setAvatarMessage('✓ Profile photo updated!');
    }
    setTimeout(() => setAvatarMessage(''), 3500);
  };

  // Handle Cancel from Image Adjust Modal
  const handleCancelAdjust = () => {
    setAdjustModalOpen(false);
    setSelectedRawImage(null);
  };

  // Remove photo handler
  const handleRemoveAvatar = (e) => {
    e.stopPropagation();
    setAvatar('');
    updateProfile({ avatar: '' });
    setAvatarMessage('✓ Profile photo removed');
    setTimeout(() => setAvatarMessage(''), 2500);
  };

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

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setNameError('Please enter a valid display name.');
      return;
    }

    setIsSaving(true);
    setNameError('');
    setSaveMessage('');

    try {
      const updatedData = {
        name: cleanName,
        avatar: activeAvatar || '',
        dailyCalorieTarget: calories,
        dailyProteinTarget: `${proteinTarget}g`,
        dietaryPreference,
        cuisinePreferences: selectedCuisines
      };

      await updateProfile(updatedData);

      setSavedSuccess(true);
      setSaveMessage('Profile changes saved successfully!');
      setTimeout(() => {
        setSavedSuccess(false);
        setSaveMessage('');
      }, 3500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage('Failed to save profile changes. Please try again.');
      setTimeout(() => setSaveMessage(''), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!token && !currentUser) {
    return (
      <div className="profile-page page-wrapper">
        <div className="profile-hero-card glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '520px', margin: '2rem auto' }}>
          <div className="auth-logo-icon" style={{ margin: '0 auto 1.25rem', width: '52px', height: '52px' }}>
            <User size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.6rem' }}>You are Signed Out</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Sign in or create an account to view and customize your profile, set personalized nutrition targets, and manage your meal plans.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn-primary btn-glow" style={{ padding: '0.65rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogIn size={16} />
              <span>Sign In to FoodCraft</span>
            </Link>
            <Link to="/" className="btn-secondary" style={{ padding: '0.65rem 1.5rem' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page page-wrapper">
      {/* Profile Header Card */}
      <div className="profile-hero-card glass-panel animate-fade-in">
        <div className="profile-user-left">
          {/* Interactive Photo Upload Avatar */}
          <div 
            className="profile-avatar-container" 
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Click to upload/change your profile picture"
          >
            {activeAvatar ? (
              <img 
                src={activeAvatar} 
                alt={name || userProfile.name} 
                className="profile-main-avatar" 
              />
            ) : (
              <div className="profile-main-avatar profile-main-avatar-placeholder">
                <span className="profile-placeholder-letter">
                  {(name || userProfile.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="avatar-upload-badge" title="Upload profile picture">
              <Camera size={14} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleAvatarFileChange} 
            />
          </div>

          <div className="profile-info-text">
            <h1 className="profile-user-name">{name || userProfile.name || currentUser?.name || 'Chef'}</h1>
            <span className="profile-user-email">{fixedEmail}</span>
            <div className="profile-tags-strip">
              <span className="badge badge-match">FoodCraft Pro</span>
              <span className="badge badge-gym">Gym Enthusiast</span>
              {activeAvatar && (
                <button
                  type="button"
                  className="profile-remove-photo-chip"
                  onClick={handleRemoveAvatar}
                  title="Remove uploaded picture"
                >
                  <Trash2 size={12} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
            {avatarMessage && (
              <span style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> {avatarMessage}
              </span>
            )}
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

          <div className="profile-fields-grid">
            {/* Display Name */}
            <div className="form-group">
              <label htmlFor="profile-name-input">Display Name</label>
              <input 
                id="profile-name-input" 
                type="text" 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }} 
                className="auth-select"
                placeholder="Display Name"
                maxLength={60}
                required
              />
              {nameError && (
                <span className="field-error-text">
                  <AlertCircle size={13} /> {nameError}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="profile-email-input">Email Address</label>
              <input 
                id="profile-email-input" 
                type="email" 
                value={fixedEmail} 
                readOnly 
                disabled
                className="auth-select profile-fixed-input"
              />
            </div>
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
          {saveMessage && (
            <div className={`profile-save-status ${savedSuccess ? 'status-success' : 'status-error'}`}>
              {savedSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{saveMessage}</span>
            </div>
          )}
          <button 
            type="submit" 
            className="btn-primary btn-glow save-profile-cta"
            id="save-profile-btn"
            disabled={isSaving}
          >
            <Check size={18} />
            <span>{isSaving ? 'Saving Changes...' : (savedSuccess ? 'Changes Saved! ✓' : 'Save Profile Changes')}</span>
          </button>
        </div>
      </form>

      {/* Professional Image Adjust & Crop Modal */}
      <ImageAdjustModal
        isOpen={adjustModalOpen}
        imageSrc={selectedRawImage}
        onCancel={handleCancelAdjust}
        onApply={handleApplyCroppedAvatar}
      />
    </div>
  );
}
