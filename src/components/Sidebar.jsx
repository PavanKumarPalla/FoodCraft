// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ChefHat, 
  ClipboardList, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut, 
  X, 
  Utensils 
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { favorites, logout, token } = useFoodCraft();
  const navigate = useNavigate();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('foodcraft_token');
      localStorage.removeItem('foodcraft_user');
      window.location.reload();
    }
    if (onClose) onClose();
    navigate('/');
  };

  const navItems = [
    {
      id: 'favourites',
      label: 'Your Favourites',
      icon: Heart,
      path: '/favorites',
      badge: favorites.length > 0 ? favorites.length : null,
      action: () => {
        navigate('/favorites');
        if (onClose) onClose();
      }
    },
    {
      id: 'cooked',
      label: 'Cooked Recipes',
      icon: ChefHat,
      path: '/recipes?filter=cooked',
      action: () => {
        navigate('/recipes?filter=cooked');
        if (onClose) onClose();
      }
    },
    {
      id: 'diet-plans',
      label: 'Your Diet Plans',
      icon: ClipboardList,
      path: '/meal-plan',
      action: () => {
        navigate('/meal-plan');
        if (onClose) onClose();
      }
    },
    {
      id: 'history',
      label: 'Recipe History',
      icon: History,
      action: () => {
        setShowHistoryModal(true);
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        setShowSettingsModal(true);
      }
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      action: () => {
        setShowHelpModal(true);
      }
    }
  ];

  return (
    <>
      {/* Backdrop for mobile / drawer */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`foodcraft-sidebar ${isOpen ? 'open' : ''}`} id="foodcraft-left-sidebar">
        {/* Close Button for drawer view */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">
          <X size={20} />
        </button>

        {/* Top Logo & Branding */}
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper" onClick={() => { navigate('/'); if (onClose) onClose(); }}>
            <div className="sidebar-logo-icon">
              <ChefHat size={26} className="chef-icon" />
              <span className="leaf-accent">🌿</span>
            </div>
            <div className="sidebar-brand-name">
              <span className="brand-food">Food</span>
              <span className="brand-craft">Craft</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="sidebar-menu-item"
                onClick={item.action}
                id={`sidebar-nav-${item.id}`}
              >
                <div className="item-icon-wrapper">
                  <Icon size={20} className="menu-icon" />
                </div>
                <span className="item-label">{item.label}</span>
                {item.badge && <span className="item-badge">{item.badge}</span>}
              </button>
            );
          })}

          {/* Logout Action (or Login if logged out) */}
          {token ? (
            <button
              className="sidebar-menu-item sidebar-logout-item"
              onClick={handleLogout}
              id="sidebar-nav-logout"
            >
              <div className="item-icon-wrapper">
                <LogOut size={20} className="menu-icon text-red" />
              </div>
              <span className="item-label">Logout</span>
            </button>
          ) : (
            <button
              className="sidebar-menu-item sidebar-login-item"
              onClick={() => { navigate('/login'); if (onClose) onClose(); }}
              id="sidebar-nav-login"
            >
              <div className="item-icon-wrapper">
                <Utensils size={20} className="menu-icon" />
              </div>
              <span className="item-label">Sign In / Register</span>
            </button>
          )}
        </nav>

        {/* Bottom Banner: Good Food. Good Mood! 💚 */}
        <div className="sidebar-bottom-banner">
          <div className="bottom-banner-content">
            <span className="mood-tagline">Good Food.</span>
            <span className="mood-tagline">Good Mood! 💚</span>
          </div>
          <div className="bottom-leaf-decor">
            <svg viewBox="0 0 120 60" className="decor-wave-svg" fill="none">
              <path
                d="M0 25 C30 10, 70 40, 120 20 L120 60 L0 60 Z"
                fill="rgba(22, 163, 74, 0.15)"
              />
            </svg>
            <span className="decor-leaf">🌿</span>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="sidebar-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="sidebar-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="setting-row">
                <div>
                  <h4>YOLOv8 Vision Scanner</h4>
                  <p>Client + Python Dual-Engine Object Detection</p>
                </div>
                <span className="status-badge-active">Active</span>
              </div>
              <div className="setting-row">
                <div>
                  <h4>Recipe Search Engine</h4>
                  <p>Sentence-BERT + Hugging Face RecipeNLG</p>
                </div>
                <span className="status-badge-active">2.2M+ Indexed</span>
              </div>
              <div className="setting-row">
                <div>
                  <h4>Measurement Units</h4>
                  <p>Metric (grams, ml, kg)</p>
                </div>
                <span className="setting-value">Metric</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="sidebar-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="sidebar-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Help & Culinary Support</h3>
              <button className="modal-close" onClick={() => setShowHelpModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="faq-item">
                <h4>📸 How does Photo Ingredient Detection work?</h4>
                <p>Upload a photo of your open fridge, cutting board, or grocery basket. Our fine-tuned YOLOv8 neural network instantly detects food items and matches recipes.</p>
              </div>
              <div className="faq-item">
                <h4>🥗 How does Diet Plan Recommendation work?</h4>
                <p>Choose your diet preference (Veg, Vegan, Keto, Gym High-Protein) and target calorie goal. FoodCraft builds balanced meals tailored to your needs.</p>
              </div>
              <div className="faq-item">
                <h4>✉️ Need Direct Assistance?</h4>
                <p>Email our chef support team at <strong>foodcraft975@gmail.com</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe History Modal */}
      {showHistoryModal && (
        <div className="sidebar-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="sidebar-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recipe History</h3>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="history-empty">
                <History size={36} className="text-muted" />
                <p>Your recently explored and cooked recipes will be automatically archived here.</p>
                <button 
                  className="btn-primary" 
                  onClick={() => { setShowHistoryModal(false); if (onClose) onClose(); navigate('/dashboard'); }}
                >
                  Browse Recipes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
