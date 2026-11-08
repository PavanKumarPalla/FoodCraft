// src/pages/Favorites.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Search, 
  Clock, 
  ArrowRight, 
  Bell, 
  User, 
  UtensilsCrossed,
  Sparkles,
  Menu
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Favorites.css';

// Curated popular items matching the referral design
const POPULAR_SUGGESTIONS = [
  {
    id: "rcp-pasta-creamy",
    title: "Creamy Tomato Pasta",
    time: 25,
    calories: 420,
    cuisine: "Italian",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80",
    description: "Al dente pasta tossed in rich sun-ripened creamy tomato herb sauce."
  },
  {
    id: "rcp-rice-fried",
    title: "Veg Fried Rice",
    time: 20,
    calories: 360,
    cuisine: "Asian",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
    description: "Fluffy wok-tossed basmati rice with crunchy garden vegetables and light sesame seasoning."
  },
  {
    id: "rcp-omelette-veg",
    title: "Vegetable Omelette",
    time: 15,
    calories: 280,
    cuisine: "Continental",
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=700&q=80",
    description: "Fluffy golden herb omelette folded with bell peppers, spinach, and diced tomatoes."
  },
  {
    id: "rcp-salad-quinoa",
    title: "Quinoa Salad Bowl",
    time: 20,
    calories: 340,
    cuisine: "Mediterranean",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80",
    description: "Nutritious roasted quinoa, ripe avocados, cherry tomatoes, and zesty lemon dressing."
  }
];

export default function Favorites() {
  const { 
    recipes, 
    favorites, 
    toggleFavorite, 
    currentUser, 
    userProfile,
    isSidebarOpen,
    toggleSidebar
  } = useFoodCraft();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recently Added');

  // Find user's favorite recipe objects
  const userFavoriteList = useMemo(() => {
    // Combine context recipes with popular suggestions
    const allKnown = [...recipes];
    POPULAR_SUGGESTIONS.forEach(p => {
      if (!allKnown.some(k => k.id === p.id)) {
        allKnown.push(p);
      }
    });

    return allKnown.filter(r => favorites.includes(r.id));
  }, [recipes, favorites]);

  // Filter & sort
  const displayedFavorites = useMemo(() => {
    let list = [...userFavoriteList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'Cooking Time') {
      list.sort((a, b) => (a.time || 0) - (b.time || 0));
    } else if (sortBy === 'Name') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'Calories') {
      list.sort((a, b) => (a.calories || 0) - (b.calories || 0));
    }

    return list;
  }, [userFavoriteList, searchQuery, sortBy]);

  const displayName = currentUser?.name || userProfile?.name || 'User';

  return (
    <div className="referral-page-layout favorites-page-container">
      {/* Main Right Content */}
      <div className="referral-main-content">
        {/* Top bar with hamburger toggle and notification/user icons */}
        <div className="referral-top-bar">
          <button 
            className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={toggleSidebar}
            aria-label="Toggle Navigation Sidebar"
            title={isSidebarOpen ? "Close Navigation Sidebar" : "Open Navigation Sidebar"}
            id="fav-sidebar-toggle-btn"
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

        {/* Header Hero Banner */}
        <div className="fav-hero-banner">
          <div className="fav-hero-info">
            <div className="fav-heart-badge">
              <Heart size={26} fill="#ef4444" color="#ef4444" />
            </div>
            <div>
              <h1 className="fav-hero-title">Your Favourites</h1>
              <p className="fav-hero-subtitle">Your favourite recipes, all in one place!</p>
            </div>
          </div>

          {/* Decorative watermark graphics */}
          <div className="fav-decor-doodle">
            <UtensilsCrossed size={42} className="decor-icon-faint" />
            <span className="decor-leaf-watermark">🌿</span>
          </div>
        </div>

        {/* Search & Sort Controls Row */}
        <div className="fav-controls-row">
          <div className="fav-search-input-wrapper">
            <Search size={18} className="search-field-icon" />
            <input
              type="text"
              placeholder="Search your favourite recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="fav-search-input"
            />
          </div>

          <div className="fav-sort-wrapper">
            <label htmlFor="fav-sort-select" className="fav-sort-label">Sort by:</label>
            <select
              id="fav-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="fav-sort-select"
            >
              <option value="Recently Added">Recently Added</option>
              <option value="Cooking Time">Cooking Time</option>
              <option value="Name">Name (A-Z)</option>
              <option value="Calories">Lowest Calories</option>
            </select>
          </div>
        </div>

        {/* Recipes Grid */}
        {displayedFavorites.length > 0 ? (
          <div className="fav-recipes-grid">
            {displayedFavorites.map((recipe) => (
              <div key={recipe.id} className="fav-recipe-card">
                <div className="fav-card-image-wrap">
                  <img 
                    src={recipe.image || "/images/diet_salad.jpg"} 
                    alt={recipe.title} 
                    className="fav-card-image"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "/images/diet_salad.jpg"; }}
                  />
                  {/* Heart Action Button */}
                  <button 
                    className="fav-card-heart-btn active"
                    onClick={() => toggleFavorite(recipe)}
                    title="Remove from Favourites"
                    aria-label="Remove from Favourites"
                  >
                    <Heart size={18} fill="#ef4444" color="#ef4444" />
                  </button>
                </div>

                <div className="fav-card-body">
                  <h3 className="fav-card-title">{recipe.title}</h3>
                  <div className="fav-card-meta">
                    <Clock size={16} className="clock-icon" />
                    <span>{recipe.time || 20} mins</span>
                  </div>

                  <button 
                    className="fav-card-action-btn"
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  >
                    <span>View Recipe</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fav-empty-container">
            <div className="fav-empty-card">
              <div className="empty-heart-ring">
                <Heart size={44} className="text-heart-empty" />
              </div>
              <h2 className="empty-title">
                {searchQuery ? `No saved recipes match "${searchQuery}"` : "No favourites added yet!"}
              </h2>
              <p className="empty-desc">
                {searchQuery
                  ? "Try searching for a different keyword or check your spelling."
                  : "Start exploring our 2.2M+ RecipeNLG collection or save popular recipes below with one tap!"}
              </p>
              {!searchQuery && (
                <button 
                  className="btn-explore-green"
                  onClick={() => navigate('/explore')}
                >
                  <Sparkles size={18} />
                  <span>Explore 2.2M+ Recipes</span>
                </button>
              )}
            </div>

            {/* Popular Suggested Recipes to Quick-Favorite */}
            <div className="fav-suggestions-section">
              <div className="section-header-tag">
                <Sparkles size={18} className="text-green" />
                <h3>Popular Recipes You Might Love</h3>
              </div>

              <div className="fav-recipes-grid">
                {POPULAR_SUGGESTIONS.map((recipe) => {
                  const isSaved = favorites.includes(recipe.id);
                  return (
                    <div key={recipe.id} className="fav-recipe-card">
                      <div className="fav-card-image-wrap">
                        <img 
                          src={recipe.image} 
                          alt={recipe.title} 
                          className="fav-card-image"
                          loading="lazy"
                        />
                        <button 
                          className={`fav-card-heart-btn ${isSaved ? 'active' : ''}`}
                          onClick={() => toggleFavorite(recipe)}
                          title={isSaved ? "Saved to Favourites" : "Save to Favourites"}
                          aria-label="Toggle favourite"
                        >
                          <Heart size={18} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "#64748b"} />
                        </button>
                      </div>

                      <div className="fav-card-body">
                        <h3 className="fav-card-title">{recipe.title}</h3>
                        <div className="fav-card-meta">
                          <Clock size={16} className="clock-icon" />
                          <span>{recipe.time} mins</span>
                        </div>

                        <button 
                          className="fav-card-action-btn"
                          onClick={() => navigate(`/recipe/${recipe.id}`)}
                        >
                          <span>View Recipe</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
