// src/components/BottomNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Camera, Calendar, User, LogIn } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './BottomNav.css';

export default function BottomNav() {
  const { token, currentUser } = useFoodCraft();
  const isLoggedIn = Boolean(token && currentUser);

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav">
        {/* Dashboard */}
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
          id="mobile-tab-home"
        >
          <div className="tab-icon-wrapper">
            <Home size={22} />
          </div>
          <span className="tab-label">Home</span>
        </NavLink>

        {/* Explore */}
        <NavLink 
          to="/explore" 
          className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
          id="mobile-tab-explore"
        >
          <div className="tab-icon-wrapper">
            <Compass size={22} />
          </div>
          <span className="tab-label">Explore</span>
        </NavLink>

        {/* Center Prominent AI Scan Button */}
        <NavLink 
          to="/scan" 
          className={({ isActive }) => `bottom-tab bottom-tab-center ${isActive ? 'active' : ''}`}
          id="mobile-tab-scan"
        >
          <div className="center-button-glow">
            <Camera size={24} />
          </div>
          <span className="tab-label-center">AI Scan</span>
        </NavLink>

        {/* Meal Plan */}
        <NavLink 
          to="/meal-plan" 
          className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
          id="mobile-tab-plan"
        >
          <div className="tab-icon-wrapper">
            <Calendar size={22} />
          </div>
          <span className="tab-label">Planner</span>
        </NavLink>

        {/* Profile / Sign In */}
        {isLoggedIn ? (
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
            id="mobile-tab-profile"
          >
            <div className="tab-icon-wrapper">
              <User size={22} />
            </div>
            <span className="tab-label">Profile</span>
          </NavLink>
        ) : (
          <NavLink 
            to="/login" 
            className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
            id="mobile-tab-login"
          >
            <div className="tab-icon-wrapper">
              <LogIn size={22} />
            </div>
            <span className="tab-label">Sign In</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
}
