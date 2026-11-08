// src/pages/Profile.jsx
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  ChefHat, 
  Calendar, 
  Star, 
  Clock, 
  Flame, 
  ArrowRight, 
  Pencil, 
  User, 
  Menu, 
  Bell, 
  Dumbbell, 
  X
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import Sidebar from '../components/Sidebar';
import ImageAdjustModal from '../components/ImageAdjustModal';
import './Profile.css';

// 3 Default favorite dishes matching Image 4
const PROFILE_FAVOURITES = [
  {
    id: "rcp-pasta-creamy",
    title: "Creamy Tomato Pasta",
    time: 25,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
    isFav: true
  },
  {
    id: "rcp-rice-fried",
    title: "Veg Fried Rice",
    time: 20,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
    isFav: false
  },
  {
    id: "rcp-omelette-veg",
    title: "Vegetable Omelette",
    time: 15,
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
    isFav: false
  }
];

// 3 Frequently Cooked Dishes matching Image 4
const FREQUENTLY_COOKED = [
  {
    id: "cook-1",
    title: "Quinoa Salad Bowl",
    time: 20,
    cookedCount: 3,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cook-2",
    title: "Grilled Veg Wrap",
    time: 15,
    cookedCount: 3,
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cook-3",
    title: "Mixed Vegetable Soup",
    time: 25,
    cookedCount: 2,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80"
  }
];

export default function Profile() {
  const { 
    currentUser, 
    userProfile, 
    updateProfile, 
    favorites, 
    toggleFavorite, 
    cookedRecipes, 
    markCooked,
    recentActivity 
  } = useFoodCraft();

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Profile Edit fields
  const [editName, setEditName] = useState(currentUser?.name || userProfile?.name || 'Murali Krishna');
  const [editPreference, setEditPreference] = useState(userProfile?.dietaryPreference || 'Vegetarian');
  const [editCalories, setEditCalories] = useState(userProfile?.dailyCalorieTarget || 2000);

  // Avatar Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedRawImage, setSelectedRawImage] = useState(null);

  const displayName = currentUser?.name || userProfile?.name || 'Murali Krishna';
  const displayAvatar = userProfile?.avatar && !userProfile.avatar.includes('unsplash.com') 
    ? userProfile.avatar 
    : null;

  const handleAvatarFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedRawImage(event.target.result);
      setAdjustModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCroppedAvatar = async (croppedDataUrl) => {
    setAdjustModalOpen(false);
    setSelectedRawImage(null);
    try {
      await updateProfile({ avatar: croppedDataUrl });
    } catch (err) {
      console.warn('Failed to save avatar:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      name: editName,
      dietaryPreference: editPreference,
      dailyCalorieTarget: Number(editCalories)
    });
    setShowEditProfileModal(false);
  };

  // Activity list for Box 4
  const activityItems = recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 3) : [
    { title: "Viewed recipe: Creamy Tomato Pasta", meta: "2 hours ago" },
    { title: "Added to favourites: Veg Fried Rice", meta: "1 day ago" },
    { title: "Completed Diet Plan: Weight Loss Plan", meta: "3 days ago" }
  ];

  return (
    <div className="referral-page-layout profile-page-container">
      {/* Left Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        docked={true}
      />

      {/* Hidden file input for Avatar Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Main Right Content */}
      <div className="referral-main-content">
        {/* Top bar with mobile hamburger and notification/user icons */}
        <div className="referral-top-bar">
          <button 
            className="mobile-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Navigation"
            title={sidebarOpen ? "Close Navigation Sidebar" : "Open Navigation Sidebar"}
          >
            <Menu size={22} />
          </button>

          <div className="referral-top-actions">
            <button className="top-notif-btn" title="Notifications">
              <Bell size={20} />
              <span className="notif-counter-bubble">2</span>
            </button>

            <div className="top-avatar-circle" title={displayName}>
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName} className="header-avatar-img" />
              ) : (
                <User size={20} />
              )}
            </div>
          </div>
        </div>

        {/* Top Banner matching Image 4 */}
        <div className="profile-hero-banner">
          <div className="profile-user-group">
            {/* Avatar with edit pencil badge */}
            <div className="profile-avatar-wrap">
              <div 
                className="profile-avatar-circle"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Change Profile Photo"
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="profile-img-tag" />
                ) : (
                  <User size={46} className="profile-default-user-icon" />
                )}
              </div>
              <button 
                className="avatar-pencil-badge"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Upload Photo"
                aria-label="Upload Photo"
              >
                <Pencil size={13} />
              </button>
            </div>

            {/* Greetings & Info */}
            <div className="profile-user-texts">
              <div className="profile-greeting-row">
                <h1 className="profile-greeting-name">Hello, {displayName}!</h1>
                <button 
                  className="profile-quick-edit-btn"
                  onClick={() => setShowEditProfileModal(true)}
                  title="Edit Profile"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <p className="profile-greeting-sub">Let's cook something delicious today! 👨‍🍳</p>
              <span className="profile-member-date">Member since: Oct 2026</span>
            </div>
          </div>

          {/* Right Salad Bowl Image */}
          <div className="profile-hero-decor">
            <img 
              src="/images/diet_salad.jpg" 
              alt="Culinary Creation" 
              className="profile-banner-salad-img" 
            />
          </div>
        </div>

        {/* Stats Row (4 Cards matching Image 4) */}
        <div className="profile-stats-grid">
          {/* Card 1: Favourites */}
          <div className="profile-stat-box" onClick={() => navigate('/favorites')}>
            <div className="stat-circle stat-heart-circle">
              <Heart size={24} fill="#ef4444" color="#ef4444" />
            </div>
            <div className="stat-details">
              <span className="stat-big-number">{favorites.length > 0 ? favorites.length : 12}</span>
              <span className="stat-sub-label">Favourites</span>
            </div>
          </div>

          {/* Card 2: Cooked Recipes */}
          <div className="profile-stat-box" onClick={() => navigate('/recipes?filter=cooked')}>
            <div className="stat-circle stat-chef-circle">
              <ChefHat size={24} className="text-forest-green" />
            </div>
            <div className="stat-details">
              <span className="stat-big-number">{cookedRecipes.length > 0 ? cookedRecipes.length : 18}</span>
              <span className="stat-sub-label">Cooked Recipes</span>
            </div>
          </div>

          {/* Card 3: Diet Plans */}
          <div className="profile-stat-box" onClick={() => navigate('/meal-plan')}>
            <div className="stat-circle stat-calendar-circle">
              <Calendar size={24} className="text-orange" />
            </div>
            <div className="stat-details">
              <span className="stat-big-number">5</span>
              <span className="stat-sub-label">Diet Plans</span>
            </div>
          </div>

          {/* Card 4: Your Rating */}
          <div className="profile-stat-box">
            <div className="stat-circle stat-star-circle">
              <Star size={24} fill="#a855f7" color="#a855f7" />
            </div>
            <div className="stat-details">
              <span className="stat-big-number">4.8</span>
              <span className="stat-sub-label">Your Rating</span>
            </div>
          </div>
        </div>

        {/* 2x2 Grid Section matching Image 4 */}
        <div className="profile-sections-grid">
          {/* Box 1: Your Favourites */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="header-title-left">
                <Heart size={20} fill="#ef4444" color="#ef4444" />
                <h3 className="section-heading">Your Favourites</h3>
              </div>
              <Link to="/favorites" className="view-all-link">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mini-cards-row">
              {PROFILE_FAVOURITES.map((dish) => {
                const isSaved = favorites.includes(dish.id) || dish.isFav;
                return (
                  <div key={dish.id} className="profile-dish-mini-card">
                    <div className="dish-img-wrap">
                      <img src={dish.image} alt={dish.title} className="dish-thumb" />
                      <button 
                        className={`mini-fav-btn ${isSaved ? 'active' : ''}`}
                        onClick={() => toggleFavorite(dish)}
                      >
                        <Heart size={14} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "#ffffff"} />
                      </button>
                    </div>

                    <div className="dish-mini-body">
                      <h4 className="dish-name">{dish.title}</h4>
                      <div className="dish-time">
                        <Clock size={13} className="text-green" />
                        <span>{dish.time} mins</span>
                      </div>
                      <button 
                        className="btn-dish-action"
                        onClick={() => navigate(`/recipes?q=${encodeURIComponent(dish.title)}`)}
                      >
                        <span>View Recipe</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Box 2: Frequently Cooked Recipes */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="header-title-left">
                <ChefHat size={20} className="text-forest-green" />
                <h3 className="section-heading">Frequently Cooked Recipes</h3>
              </div>
              <Link to="/recipes?filter=cooked" className="view-all-link">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mini-cards-row">
              {FREQUENTLY_COOKED.map((dish) => (
                <div key={dish.id} className="profile-dish-mini-card">
                  <div className="dish-img-wrap">
                    <img src={dish.image} alt={dish.title} className="dish-thumb" />
                    <span className="cooked-count-badge">
                      <Flame size={12} className="flame-icon" />
                      <span>{dish.cookedCount} times</span>
                    </span>
                  </div>

                  <div className="dish-mini-body">
                    <h4 className="dish-name">{dish.title}</h4>
                    <div className="dish-time">
                      <Clock size={13} className="text-green" />
                      <span>{dish.time} mins</span>
                    </div>
                    <button 
                      className="btn-dish-action"
                      onClick={() => {
                        markCooked(dish);
                        navigate(`/recipes?q=${encodeURIComponent(dish.title)}`);
                      }}
                    >
                      <span>Cook Again</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 3: Your Diet Plans */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="header-title-left">
                <Calendar size={20} className="text-forest-green" />
                <h3 className="section-heading">Your Diet Plans</h3>
              </div>
              <Link to="/meal-plan" className="view-all-link">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="diet-plans-list">
              {/* Plan 1: Balanced Diet Plan */}
              <div className="diet-plan-row" onClick={() => navigate('/meal-plan')}>
                <div className="plan-left-icon green-leaf-bg">
                  <span className="leaf-emoji">🍃</span>
                </div>
                <div className="plan-text-group">
                  <h4 className="plan-row-title">Balanced Diet Plan</h4>
                  <p className="plan-row-sub">Healthy. Tasty. Balanced.</p>
                </div>
                <span className="badge-active-green">Active</span>
              </div>

              {/* Plan 2: Weight Loss Plan */}
              <div className="diet-plan-row" onClick={() => navigate('/meal-plan')}>
                <div className="plan-left-icon orange-arm-bg">
                  <Dumbbell size={20} className="text-orange" />
                </div>
                <div className="plan-text-group">
                  <h4 className="plan-row-title">Weight Loss Plan</h4>
                  <p className="plan-row-sub">Eat Smart. Stay Fit.</p>
                </div>
                <span className="badge-completed-gray">Completed</span>
              </div>
            </div>
          </div>

          {/* Box 4: Recent Activity */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="header-title-left">
                <Clock size={20} className="text-forest-green" />
                <h3 className="section-heading">Recent Activity</h3>
              </div>
              <Link to="/recent-activity" className="view-all-link">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="profile-activity-list">
              {activityItems.map((item, idx) => (
                <div key={idx} className="profile-act-row">
                  <div className="act-dot" />
                  <div className="act-texts">
                    <span className="act-title">{item.title}</span>
                  </div>
                  <span className="act-time">{item.meta || 'Recently'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="diet-modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="diet-modal-card modal-small" onClick={e => e.stopPropagation()}>
            <div className="diet-modal-header">
              <div>
                <span className="modal-chip">Profile Settings</span>
                <h2 className="diet-modal-title">Edit Your Profile</h2>
              </div>
              <button className="diet-modal-close" onClick={() => setShowEditProfileModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveProfile} className="diet-modal-form">
              <div className="form-group">
                <label>Your Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="diet-form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Dietary Preference</label>
                <select 
                  value={editPreference}
                  onChange={(e) => setEditPreference(e.target.value)}
                  className="diet-form-select"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>

              <div className="form-group">
                <label>Daily Calorie Target (kcal)</label>
                <input 
                  type="number" 
                  value={editCalories}
                  onChange={(e) => setEditCalories(e.target.value)}
                  className="diet-form-input"
                  min="1000"
                  max="4000"
                />
              </div>

              <button type="submit" className="btn-modal-primary">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Adjust Modal for Cropping Avatar */}
      <ImageAdjustModal
        isOpen={adjustModalOpen}
        imageSrc={selectedRawImage}
        onCancel={() => { setAdjustModalOpen(false); setSelectedRawImage(null); }}
        onApply={handleApplyCroppedAvatar}
      />
    </div>
  );
}
