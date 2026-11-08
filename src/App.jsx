// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FoodCraftProvider, useFoodCraft } from './context/FoodCraftContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ScanIngredients from './pages/ScanIngredients';
import RecipeResults from './pages/RecipeResults';
import RecipeDetail from './pages/RecipeDetail';
import MealPlanner from './pages/MealPlanner';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import RecentActivity from './pages/RecentActivity';

// Public auth route: Redirects to / if user is already logged in
function PublicAuthRoute({ children }) {
  const { token } = useFoodCraft();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function LayoutWrapper() {
  const location = useLocation();
  const { isSidebarOpen, closeSidebar } = useFoodCraft();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Custom docked sidebar pages matching referral designs
  const isCustomDockedPage = [
    '/', 
    '/favorites', 
    '/recent-activity', 
    '/activity', 
    '/meal-plan', 
    '/meal-planner', 
    '/profile',
    '/account'
  ].includes(location.pathname);

  return (
    <div className={`app-container ${isAuthPage ? 'auth-layout' : ''} ${isCustomDockedPage ? 'docked-layout' : ''} ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Universal Left Sidebar - Rendered on ALL pages except /login and /register */}
      {!isAuthPage && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar} 
          docked={true}
        />
      )}

      {/* Main Routed Page Content */}
      <div className={`app-content-body ${!isAuthPage && isSidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        {/* Top Navbar (hidden on auth pages and custom docked referral pages) */}
        {!isAuthPage && !isCustomDockedPage && <Navbar />}

        <main className={`main-content ${isAuthPage ? 'auth-main' : ''} ${isCustomDockedPage ? 'docked-main' : ''}`}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
            <Route path="/register" element={<PublicAuthRoute><Register /></PublicAuthRoute>} />
            
            {/* Dashboard removed as requested - redirects directly to Home */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            
            <Route path="/scan" element={<ScanIngredients />} />
            <Route path="/recipes" element={<RecipeResults />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            
            {/* Diet Plan / Meal Planner */}
            <Route path="/meal-plan" element={<MealPlanner />} />
            <Route path="/meal-planner" element={<Navigate to="/meal-plan" replace />} />
            
            {/* Explore */}
            <Route path="/explore" element={<Explore />} />
            
            {/* Favourites */}
            <Route path="/favorites" element={<Favorites />} />
            
            {/* Recent Activity */}
            <Route path="/recent-activity" element={<RecentActivity />} />
            <Route path="/activity" element={<Navigate to="/recent-activity" replace />} />
            
            {/* Profile / Account */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/account" element={<Navigate to="/profile" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Mobile Floating Bottom Bar (hidden on auth pages and docked pages where sidebar is primary) */}
        {!isAuthPage && !isCustomDockedPage && <BottomNav />}
      </div>
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
