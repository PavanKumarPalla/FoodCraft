// src/pages/Favorites.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, ArrowRight } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import RecipeCard from '../components/RecipeCard';
import './Favorites.css';

export default function Favorites() {
  const { recipes, favorites } = useFoodCraft();
  const [searchTerm, setSearchTerm] = useState('');

  const favoriteRecipes = recipes.filter(r => favorites.includes(r.id));

  const filteredFavorites = favoriteRecipes.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);
  });

  return (
    <div className="favorites-page page-wrapper">
      {/* Header */}
      <div className="favorites-header animate-fade-in">
        <div>
          <div className="fav-badge">
            <Heart size={14} fill="#ef4444" color="#ef4444" />
            <span>Saved Bookmarks</span>
          </div>
          <h1 className="fav-title">Your Favorite Recipes</h1>
          <p className="fav-subtitle">
            Quick access to your loved dishes, breakfast staples, and high-protein favorites
          </p>
        </div>

        {favoriteRecipes.length > 0 && (
          <span className="fav-counter-badge">{favoriteRecipes.length} Saved</span>
        )}
      </div>

      {favoriteRecipes.length > 0 && (
        <div className="fav-search-bar glass-panel">
          <Search size={17} className="fav-search-icon" />
          <input
            id="favorites-search-input"
            type="text"
            placeholder="Search within your saved recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Grid */}
      {filteredFavorites.length > 0 ? (
        <div className="recipes-grid">
          {filteredFavorites.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="empty-favorites-box glass-panel">
          <div className="empty-heart-icon">
            <Heart size={44} />
          </div>
          <h2>No Saved Recipes Yet</h2>
          <p>
            Tap the heart icon on any recipe card or detail page to bookmark recipes for quick access here.
          </p>
          <Link to="/recipes" className="btn-primary btn-glow" id="fav-browse-recipes-btn">
            <span>Explore Delicious Recipes</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}
