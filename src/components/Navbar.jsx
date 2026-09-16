// src/components/Navbar.jsx
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Heart, Search, Utensils, Calendar, Camera, LogIn } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Navbar.css';

export default function Navbar() {
  const { favorites, userProfile, searchQuery, setSearchQuery, token, currentUser } = useFoodCraft();
  const navigate = useNavigate();

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
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/dashboard" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <Utensils className="brand-icon" size={22} />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">Food<span className="brand-accent">Craft</span></span>
            <span className="brand-badge">AI 2.2M+</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Explore
          </NavLink>
          <NavLink to="/scan" className={({ isActive }) => `nav-link nav-link-highlight ${isActive ? 'active' : ''}`}>
            <Camera size={16} />
            <span>Scan Fridge</span>
            <span className="pill-pulse">YOLOv8</span>
          </NavLink>
          <NavLink to="/meal-plan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Calendar size={16} />
            <span>7-Day Plan</span>
          </NavLink>
        </nav>

        {/* Search Bar */}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <Search className="search-icon" size={17} />
          <input
            id="nav-search-input"
            type="text"
            placeholder="Search recipes, ingredients, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Actions (Favorites & Profile / Sign In) */}
        <div className="navbar-actions">
          <Link to="/favorites" className="action-btn favorites-btn" title="Saved Favorites" id="nav-favorites-link">
            <Heart size={20} className={favorites.length > 0 ? "text-heart-active" : ""} />
            {favorites.length > 0 && (
              <span className="counter-bubble">{favorites.length}</span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link to="/profile" className="profile-chip" id="nav-profile-link" title="My Profile">
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
            <Link to="/login" className="nav-login-btn" id="nav-login-link" title="Sign In to FoodCraft">
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
