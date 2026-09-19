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
    return saved ? JSON.parse(saved) : ['rcp-1', 'rcp-3', 'rcp-7'];
  });

  const [userProfile, setUserProfile] = useState(() => {
    const token = localStorage.getItem('foodcraft_token');
    if (!token) {
      return INITIAL_USER_PROFILE;
    }
    const saved = localStorage.getItem('foodcraft_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.avatar && parsed.avatar.includes('unsplash.com')) {
          parsed.avatar = '';
        }
        return parsed;
      } catch {
        return INITIAL_USER_PROFILE;
      }
    }
    return INITIAL_USER_PROFILE;
  });

  const [mealPlan, setMealPlan] = useState(() => {
    const saved = localStorage.getItem('foodcraft_mealplan');
    return saved ? JSON.parse(saved) : WEEKLY_MEAL_PLAN;
  });

  const [scannedIngredients, setScannedIngredients] = useState([
    'Tomatoes', 'Eggs', 'Bell Peppers', 'Garlic', 'Paneer'
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Auth & MongoDB User State
  const [token, setToken] = useState(() => localStorage.getItem('foodcraft_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('foodcraft_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('foodcraft_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('foodcraft_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('foodcraft_mealplan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('foodcraft_token', token);
    } else {
      localStorage.removeItem('foodcraft_token');
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('foodcraft_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('foodcraft_user');
    }
  }, [currentUser]);

  // Load authenticated user profile from MongoDB on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            const cleanAvatar = (data.user.avatar && !data.user.avatar.includes('unsplash.com'))
              ? data.user.avatar 
              : (prev.avatar && !prev.avatar.includes('unsplash.com')) 
                ? prev.avatar 
                : '';

            if (data.user.profile) {
              setUserProfile(prev => ({ 
                ...prev, 
                name: data.user.name,
                avatar: cleanAvatar,
                ...data.user.profile 
              }));
            } else {
              setUserProfile(prev => ({ ...prev, avatar: cleanAvatar }));
            }
            if (data.user.favorites && data.user.favorites.length > 0) {
              setFavorites(data.user.favorites);
            }
            if (data.user.mealPlan && Object.keys(data.user.mealPlan).length > 0) {
              setMealPlan(data.user.mealPlan);
            }
          } else {
            // Token expired or invalid
            setToken(null);
            setCurrentUser(null);
          }
        })
        .catch(() => {
          // Offline or local mock mode
        });
    }
  }, [token]);

  // Register with MongoDB
  const register = async ({ name, email, password, dietaryType, healthGoals }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, dietaryType, healthGoals }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      setToken(data.token);
      setCurrentUser(data.user);
      if (data.user.profile) {
        setUserProfile(prev => ({ ...prev, name: data.user.name, ...data.user.profile }));
      }
      setAuthLoading(false);
      return { success: true, message: data.message };
    } catch (err) {
      setAuthLoading(false);
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Login with MongoDB (Supports Email or Phone Number)
  const login = async ({ email, identifier, password }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email || identifier, 
          identifier: identifier || email, 
          password 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      setToken(data.token);
      setCurrentUser(data.user);
      if (data.user.profile) {
        setUserProfile(prev => ({ ...prev, name: data.user.name, ...data.user.profile }));
      }
      if (data.user.favorites) {
        setFavorites(data.user.favorites);
      }
      if (data.user.mealPlan && Object.keys(data.user.mealPlan).length > 0) {
        setMealPlan(data.user.mealPlan);
      }
      setAuthLoading(false);
      return { success: true, message: data.message };
    } catch (err) {
      setAuthLoading(false);
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Google Sign-In with MongoDB
  const googleLogin = async (credential) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }

      if (data.newUser) {
        // User not in DB → return info so Login page can redirect to Register
        setAuthLoading(false);
        return { success: true, newUser: true, googleUser: data.googleUser, message: data.message };
      }

      // Existing user → login directly
      setToken(data.token);
      setCurrentUser(data.user);
      if (data.user.profile) {
        setUserProfile(prev => ({ ...prev, name: data.user.name, ...data.user.profile }));
      }
      if (data.user.favorites) {
        setFavorites(data.user.favorites);
      }
      if (data.user.mealPlan && Object.keys(data.user.mealPlan).length > 0) {
        setMealPlan(data.user.mealPlan);
      }
      setAuthLoading(false);
      return { success: true, newUser: false, message: data.message };
    } catch (err) {
      setAuthLoading(false);
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setUserProfile(INITIAL_USER_PROFILE);
    setFavorites([]);
    localStorage.removeItem('foodcraft_token');
    localStorage.removeItem('foodcraft_user');
    localStorage.removeItem('foodcraft_profile');
    localStorage.removeItem('foodcraft_favorites');
  };

  // Toggle favorite (syncs to MongoDB if logged in)
  const toggleFavorite = async (recipeId) => {
    setFavorites(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );

    if (token) {
      try {
        await fetch('/api/auth/favorites/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ recipeId })
        });
      } catch (err) {
        console.warn('Could not sync favorite to MongoDB:', err);
      }
    }
  };

  const isFavorite = (recipeId) => favorites.includes(recipeId);

  // Update profile & avatar (syncs to MongoDB if logged in)
  const updateProfile = async (newProfileData) => {
    setUserProfile(prev => ({ ...prev, ...newProfileData }));

    if (token) {
      try {
        const { avatar, name, phone, ...profileFields } = newProfileData;
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ 
            avatar,
            name,
            phone,
            profile: profileFields 
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.warn('Could not sync profile to MongoDB:', err);
      }
    }
  };

  // Save customized meal plan to MongoDB
  const saveMealPlan = async (newPlan) => {
    setMealPlan(newPlan);

    if (token) {
      try {
        await fetch('/api/auth/mealplan', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ mealPlan: newPlan })
        });
      } catch (err) {
        console.warn('Could not sync meal plan to MongoDB:', err);
      }
    }
  };

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
      updateProfile,
      mealPlan,
      setMealPlan,
      saveMealPlan,
      scannedIngredients,
      setScannedIngredients,
      addScannedIngredient,
      removeScannedIngredient,
      resetScannedIngredients,
      searchQuery,
      setSearchQuery,
      activeFilter,
      setActiveFilter,
      // Auth state & methods
      currentUser,
      setCurrentUser,
      token,
      setToken,
      authLoading,
      authError,
      register,
      login,
      logout,
      googleLogin,
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
