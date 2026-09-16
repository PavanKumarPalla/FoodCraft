// src/context/FoodCraftContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_RECIPES, INITIAL_USER_PROFILE, WEEKLY_MEAL_PLAN } from '../data/mockData';

const FoodCraftContext = createContext();

export function FoodCraftProvider({ children }) {
  const [recipes, setRecipes] = useState(() => {
    const saved = localStorage.getItem('foodcraft_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('foodcraft_favorites');
    return saved ? JSON.parse(saved) : ["rcp-1", "rcp-3", "rcp-7"];
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('foodcraft_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [mealPlan, setMealPlan] = useState(() => {
    const saved = localStorage.getItem('foodcraft_mealplan');
    return saved ? JSON.parse(saved) : WEEKLY_MEAL_PLAN;
  });

  const [scannedIngredients, setScannedIngredients] = useState([
    "Tomatoes", "Eggs", "Bell Peppers", "Garlic", "Paneer"
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    localStorage.setItem('foodcraft_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('foodcraft_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('foodcraft_mealplan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  const toggleFavorite = (recipeId) => {
    setFavorites(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const isFavorite = (recipeId) => favorites.includes(recipeId);

  const addScannedIngredient = (item) => {
    const trimmed = item.trim();
    if (trimmed && !scannedIngredients.includes(trimmed)) {
      setScannedIngredients(prev => [...prev, trimmed]);
    }
  };

  const removeScannedIngredient = (item) => {
    setScannedIngredients(prev => prev.filter(i => i !== item));
  };

  const resetScannedIngredients = () => {
    setScannedIngredients([]);
  };

  return (
    <FoodCraftContext.Provider value={{
      recipes,
      setRecipes,
      favorites,
      isFavorite,
      toggleFavorite,
      userProfile,
      setUserProfile,
      mealPlan,
      setMealPlan,
      scannedIngredients,
      setScannedIngredients,
      addScannedIngredient,
      removeScannedIngredient,
      resetScannedIngredients,
      searchQuery,
      setSearchQuery,
      activeFilter,
      setActiveFilter
    }}>
      {children}
    </FoodCraftContext.Provider>
  );
}

export function useFoodCraft() {
  const context = useContext(FoodCraftContext);
  if (!context) {
    throw new Error('useFoodCraft must be used within FoodCraftProvider');
  }
  return context;
}
