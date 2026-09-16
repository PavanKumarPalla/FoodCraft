// src/pages/RecipeResults.jsx
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, Sparkles, Utensils, X } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import RecipeCard from '../components/RecipeCard';
import FilterBar from '../components/FilterBar';
import './RecipeResults.css';

export default function RecipeResults() {
  const { recipes, scannedIngredients } = useFoodCraft();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialFilterKey = searchParams.get('filterKey') || '';
  const initialFilterVal = searchParams.get('filterVal') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'time' | 'rating' | 'calories'

  // Apply filters & search & sorting
  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q))
      );
    }

    // Filter by query params if present
    if (initialFilterKey && initialFilterVal) {
      result = result.filter(r => {
        if (initialFilterKey === 'cuisine') return r.cuisine === initialFilterVal;
        if (initialFilterKey === 'dietType') return r.dietType === initialFilterVal;
        if (initialFilterKey === 'mealType') return r.mealType === initialFilterVal;
        if (initialFilterKey === 'healthTags') return r.healthTags.some(t => t.includes(initialFilterVal));
        return true;
      });
    }

    // Filter by active pill
    if (activeFilter !== 'All') {
      result = result.filter(r => {
        if (activeFilter === 'Veg') return r.dietType === 'veg';
        if (activeFilter === 'Non-Veg') return r.dietType === 'non-veg';
        if (activeFilter === 'Gym') return r.healthTags.some(t => t.includes('Protein') || t.includes('Gym'));
        if (activeFilter === 'Low Sugar') return r.healthTags.some(t => t.includes('Low Sugar'));
        if (activeFilter === 'Low Salt') return r.healthTags.some(t => t.includes('Low Salt'));
        if (activeFilter === 'Snacks') return r.mealType === 'Snacks';
        if (activeFilter === 'South Indian') return r.cuisine === 'South Indian';
        if (activeFilter === 'North Indian') return r.cuisine === 'North Indian';
        if (activeFilter === 'Quick') return r.time <= 20;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      if (sortBy === 'time') return a.time - b.time;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'calories') return a.calories - b.calories;
      return 0;
    });

    return result;
  }, [recipes, searchQuery, activeFilter, sortBy, initialFilterKey, initialFilterVal]);

  const clearCategoryParam = () => {
    setSearchParams({});
  };

  return (
    <div className="results-page page-wrapper">
      {/* Header */}
      <div className="results-header animate-fade-in">
        <div className="results-title-group">
          <h1 className="results-main-title">Recipe Recommendations</h1>
          <p className="results-subtitle">
            Matched via <strong>Sentence-BERT</strong> vector ranking across 2.2M+ RecipeNLG recipes
          </p>
        </div>

        {/* Active Category Filter Tag if routed from Explore */}
        {initialCategory && (
          <div className="active-category-pill">
            <span>Category: <strong>{initialCategory}</strong></span>
            <button type="button" onClick={clearCategoryParam} title="Clear category filter">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="results-controls-bar glass-panel">
        <div className="results-search-wrapper">
          <Search size={17} className="control-search-icon" />
          <input
            id="results-search-input"
            type="text"
            placeholder="Filter by recipe name or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="sort-dropdown-wrapper">
          <ArrowUpDown size={15} className="sort-icon" />
          <label htmlFor="recipe-sort-select" className="sr-only">Sort Recipes</label>
          <select 
            id="recipe-sort-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="match">Highest Match % (SBERT)</option>
            <option value="time">Fastest Cook Time</option>
            <option value="rating">Highest Rated</option>
            <option value="calories">Lowest Calories</option>
          </select>
        </div>
      </div>

      {/* Filter Pills */}
      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Results Count & Match Indicator */}
      <div className="results-count-bar">
        <span className="count-text">
          Showing <strong>{filteredAndSortedRecipes.length}</strong> recipes
        </span>
        {scannedIngredients.length > 0 && (
          <span className="scanned-info-pill">
            <Sparkles size={13} />
            <span>Using {scannedIngredients.length} fridge ingredients</span>
          </span>
        )}
      </div>

      {/* Recipe Grid */}
      <div className="recipes-grid">
        {filteredAndSortedRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedRecipes.length === 0 && (
        <div className="empty-state-box glass-panel">
          <Utensils size={42} className="empty-icon" />
          <h3>No matching recipes found</h3>
          <p>Try searching for different ingredients or clearing your active filters.</p>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('All');
              clearCategoryParam();
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
