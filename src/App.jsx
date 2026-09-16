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

// Protected route: Redirects to /login if user is not logged in (e.g. after signout & clicking Back)
function ProtectedRoute({ children }) {
  const { token } = useFoodCraft();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

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
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><ScanIngredients /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><RecipeResults /></ProtectedRoute>} />
          <Route path="/recipe/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
          <Route path="/meal-plan" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
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
