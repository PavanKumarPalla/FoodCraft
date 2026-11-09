// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Search, ChefHat, Calendar, Camera, Menu, Utensils, 
  Bell, User, Compass, X, Sparkles
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Navbar.css';

export default function Navbar() {
  const { 
    favorites, 
    userProfile, 
    searchQuery, 
    setSearchQuery, 
    token, 
    currentUser, 
    isSidebarOpen, 
    toggleSidebar 
  } = useFoodCraft();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isLoggedIn = Boolean(token && currentUser);
  const displayName = currentUser?.name || userProfile?.name || '';
  const firstLetter = displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : 'U';
  const firstName = displayName.trim() ? displayName.trim().split(' ')[0] : 'Profile';

  return (
    <header className="navbar-header" id="foodcraft-global-header">
      <div className="navbar-container">
        {/* Left: Hamburger Toggle & Brand Logo */}
        <div className="navbar-brand-left">
          <button 
            type="button"
            className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={toggleSidebar}
            aria-label="Toggle Navigation Sidebar"
            title={isSidebarOpen ? "Close Navigation Sidebar" : "Open Navigation Sidebar"}
            id="navbar-sidebar-toggle-btn"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="home-logo-link" title="FoodCraft Home">
            <div className="home-logo-badge">
              <ChefHat size={22} className="logo-chef" />
              <span className="logo-leaf">🌿</span>
            </div>
            <span className="home-logo-text">Food<span className="logo-accent">Craft</span></span>
          </Link>
        </div>

        {/* Center: Main Navigation Links */}
        <nav className="navbar-links" aria-label="Main Navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Utensils size={15} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Compass size={15} />
            <span>Explore</span>
          </NavLink>
          <NavLink to="/scan" className={({ isActive }) => `nav-link nav-link-highlight ${isActive ? 'active' : ''}`}>
            <Camera size={15} />
            <span>Scan Fridge</span>
            <span className="pill-pulse">YOLOv8</span>
          </NavLink>
          <NavLink to="/diet-plan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Calendar size={15} />
            <span>Diet Plan</span>
          </NavLink>
          <NavLink to="/meal-planner" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={15} />
            <span>Meal Planner</span>
          </NavLink>
        </nav>

        {/* Search Bar */}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <Search className="search-icon" size={17} />
          <input
            id="nav-search-input"
            type="text"
            placeholder="Search 2.2M+ recipes, ingredients, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Right Actions: Favorites, Notifications & Profile / Sign In */}
        <div className="navbar-actions">
          {/* Saved Favorites */}
          <Link 
            to="/favorites" 
            className="action-btn favorites-btn" 
            title="Saved Favorites" 
            id="nav-favorites-link"
          >
            <Heart size={19} className={favorites.length > 0 ? "text-heart-active" : ""} />
            {favorites.length > 0 && (
              <span className="counter-bubble">{favorites.length}</span>
            )}
          </Link>

          {/* Notifications Dropdown */}
          <div className="notif-wrapper" ref={notifRef}>
            <button 
              type="button"
              className="action-btn notif-btn"
              title="Notifications"
              onClick={() => setShowNotif(!showNotif)}
              id="nav-notif-btn"
              aria-label="View notifications"
            >
              <Bell size={19} />
              <span className="notif-counter-bubble">2</span>
            </button>

            {showNotif && (
              <div className="nav-notif-dropdown">
                <div className="notif-dropdown-header">
                  <div className="notif-heading-group">
                    <Bell size={15} className="text-leaf" />
                    <span className="notif-heading">Notifications</span>
                  </div>
                  <span className="notif-count-badge">2 New</span>
                </div>
                <div className="notif-items-list">
                  <div className="notif-dropdown-item">
                    <span className="notif-dot"></span>
                    <div className="notif-item-body">
                      <p className="notif-item-title">Daily Meal Planner Ready</p>
                      <p className="notif-item-sub">Choose your custom morning, afternoon, and night recipes from verified culinary data.</p>
                    </div>
                  </div>
                  <div className="notif-dropdown-item">
                    <span className="notif-dot"></span>
                    <div className="notif-item-body">
                      <p className="notif-item-title">YOLOv8 Ingredient Detection</p>
                      <p className="notif-item-sub">Upload or photograph your fridge items for instant recipe recommendations.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Chip / Sign In Button */}
          {isLoggedIn ? (
            <Link 
              to="/profile" 
              className="profile-chip" 
              id="nav-profile-link" 
              title={`Signed in as ${displayName}`}
            >
              {userProfile.avatar && !userProfile.avatar.includes('unsplash.com') ? (
                <img src={userProfile.avatar} alt={displayName} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {firstLetter}
                </div>
              )}
              <span className="profile-name">{firstName}</span>
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="nav-login-btn" 
              id="nav-login-link" 
              title="Sign In to FoodCraft"
            >
              <User size={16} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
