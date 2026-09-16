// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FoodCraftProvider, useFoodCraft } from './context/FoodCraftContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ScanIngredients from './pages/ScanIngredients';
import RecipeResults from './pages/RecipeResults';
import RecipeDetail from './pages/RecipeDetail';
import MealPlanner from './pages/MealPlanner';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';

// Public auth route: Redirects to /dashboard if user is already logged in
function PublicAuthRoute({ children }) {
  const { token } = useFoodCraft();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function LayoutWrapper() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={`app-container ${isAuthPage ? 'auth-layout' : ''}`}>
      {/* Top Navbar (hidden on auth pages like login and register) */}
      {!isAuthPage && <Navbar />}

      {/* Main Routed Page Content */}
      <main className={`main-content ${isAuthPage ? 'auth-main' : ''}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
          <Route path="/register" element={<PublicAuthRoute><Register /></PublicAuthRoute>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<ScanIngredients />} />
          <Route path="/recipes" element={<RecipeResults />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/meal-plan" element={<MealPlanner />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Floating Bottom Bar (hidden on auth pages) */}
      {!isAuthPage && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <FoodCraftProvider>
      <BrowserRouter>
        <LayoutWrapper />
      </BrowserRouter>
    </FoodCraftProvider>
  );
}
