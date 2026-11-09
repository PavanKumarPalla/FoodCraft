// src/pages/RecentActivity.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History, 
  ChefHat, 
  Heart, 
  Calendar, 
  ChevronRight, 
  Bell, 
  User, 
  Menu
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './RecentActivity.css';

// Default initial activities to showcase if user history is pristine
const DEFAULT_INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    type: "viewed",
    label: "Viewed recipe:",
    title: "Creamy Tomato Pasta",
    time: "2 hours ago",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80",
    link: "/recipes?q=Creamy+Tomato+Pasta"
  },
  {
    id: "act-2",
    type: "diet_plan",
    label: "Added to diet plan:",
    title: "Balanced Diet",
    time: "1 day ago",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    link: "/meal-plan"
  },
  {
    id: "act-3",
    type: "completed",
    label: "Completed Diet Plan:",
    title: "Weight Loss Plan",
    time: "3 days ago",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80",
    link: "/meal-plan"
  },
  {
    id: "act-4",
    type: "search",
    label: "Searched for:",
    title: "Veg Recipes",
    time: "5 days ago",
    image: "/images/diet_salad.jpg",
    link: "/recipes?q=veg"
  }
];

export default function RecentActivity() {
  const { recentActivity, favorites, currentUser, userProfile, isSidebarOpen, toggleSidebar } = useFoodCraft();
  const navigate = useNavigate();

  const displayName = currentUser?.name || userProfile?.name || 'User';

  // Merge dynamic activity with defaults so the screen is beautifully populated
  const activities = recentActivity && recentActivity.length > 0 
    ? recentActivity 
    : DEFAULT_INITIAL_ACTIVITIES;

  const recipesViewedCount = Math.max(12, (recentActivity?.filter(a => a.type === 'viewed')?.length || 0) + 12);
  const favCount = favorites.length > 0 ? favorites.length : 5;
  const dietPlanCount = 2;

  return (
    <div className="referral-page-layout activity-page-container">
      {/* Main Right Content */}
      <div className="referral-main-content">
        {/* Header Hero Banner */}
        <div className="activity-hero-banner">
          <div className="activity-hero-info">
            <div className="activity-icon-badge">
              <History size={26} className="text-white" />
            </div>
            <div>
              <h1 className="activity-hero-title">Recent Activity</h1>
              <p className="activity-hero-subtitle">Your recent interactions and activity history.</p>
            </div>
          </div>

          <div className="activity-decor-leaf">
            <span className="decor-leaf-watermark">🌿</span>
          </div>
        </div>

        {/* Content Layout: 2 Columns (Timeline + Quick Stats) */}
        <div className="activity-layout-grid">
          {/* Left Column: Timeline Card */}
          <div className="activity-timeline-card">
            <div className="timeline-items-list">
              {activities.map((item, index) => {
                const label = item.label || (
                  item.type === 'viewed' ? 'Viewed recipe:' :
                  item.type === 'favorite' ? 'Added to favourites:' :
                  item.type === 'diet_plan' ? 'Added to diet plan:' :
                  item.type === 'completed' ? 'Completed Diet Plan:' :
                  item.type === 'cooked' ? 'Cooked recipe:' : 'Searched for:'
                );

                return (
                  <div 
                    key={item.id || index} 
                    className="timeline-item"
                    onClick={() => item.link && navigate(item.link)}
                  >
                    {/* Left node with vertical connecting line */}
                    <div className="timeline-node-track">
                      <div className="timeline-node-circle" />
                      {index < activities.length - 1 && <div className="timeline-connector-line" />}
                    </div>

                    {/* Timeline Item Content */}
                    <div className="timeline-item-content">
                      <img 
                        src={item.image || "/images/diet_salad.jpg"} 
                        alt={item.title} 
                        className="timeline-thumbnail"
                        onError={(e) => { e.currentTarget.src = "/images/diet_salad.jpg"; }}
                      />

                      <div className="timeline-text-wrapper">
                        <span className="timeline-action-label">{label}</span>{' '}
                        <span className="timeline-action-title">{item.title}</span>
                      </div>

                      <div className="timeline-meta-wrapper">
                        <span className="timeline-time-text">{item.meta || item.time || 'Recently'}</span>
                        <ChevronRight size={18} className="timeline-chevron" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Quick Stats Card */}
          <div className="activity-stats-card">
            <h2 className="stats-card-title">Quick Stats</h2>

            <div className="stats-list">
              {/* Stat 1: Recipes Viewed */}
              <div className="quick-stat-row">
                <div className="stat-icon-circle stat-green">
                  <ChefHat size={26} className="text-forest-green" />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{recipesViewedCount}</span>
                  <span className="stat-label">Recipes Viewed</span>
                </div>
              </div>

              {/* Stat 2: Favourite Recipes */}
              <div className="quick-stat-row">
                <div className="stat-icon-circle stat-red">
                  <Heart size={26} fill="#ef4444" color="#ef4444" />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{favCount}</span>
                  <span className="stat-label">Favourite Recipes</span>
                </div>
              </div>

              {/* Stat 3: Diet Plans */}
              <div className="quick-stat-row">
                <div className="stat-icon-circle stat-orange">
                  <Calendar size={26} className="text-orange" />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{dietPlanCount}</span>
                  <span className="stat-label">Diet Plans</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
