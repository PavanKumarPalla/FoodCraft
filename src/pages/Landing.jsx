// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Camera, Cpu, ArrowRight, Utensils } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-badge animate-fade-in">
          <Sparkles size={15} className="sparkle-icon" />
          <span>Intelligent Culinary AI Platform</span>
        </div>

        <h1 className="landing-hero-title animate-fade-in">
          Craft Delicious Meals From <br />
          <span className="hero-gradient-text">Ingredients You Already Have</span>
        </h1>

        <p className="landing-hero-subtitle animate-fade-in">
          Powered by <strong>YOLOv8</strong> object vision and <strong>Sentence-BERT</strong> vector search across <strong>2.2 Million+ verified recipes</strong> from RecipeNLG. No more food waste, no more daily dinner stress.
        </p>

        <div className="landing-cta-group animate-fade-in">
          <Link to="/dashboard" className="btn-primary btn-glow landing-cta-primary" id="landing-get-started-btn">
            <span>Explore Dashboard</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/scan" className="btn-secondary landing-cta-secondary" id="landing-scan-btn">
            <Camera size={18} />
            <span>Scan My Fridge</span>
          </Link>
        </div>

        {/* Live Metrics Floating Bar */}
        <div className="landing-metrics-strip glass-panel">
          <div className="metric-stat">
            <span className="stat-number">2.2M+</span>
            <span className="stat-label">Verified Recipes</span>
          </div>
          <div className="stat-divider"></div>
          <div className="metric-stat">
            <span className="stat-number">YOLOv8</span>
            <span className="stat-label">Vision Detection</span>
          </div>
          <div className="stat-divider"></div>
          <div className="metric-stat">
            <span className="stat-number">FAISS</span>
            <span className="stat-label">Instant Vector Match</span>
          </div>
          <div className="stat-divider"></div>
          <div className="metric-stat">
            <span className="stat-number">7-Day</span>
            <span className="stat-label">Macro Meal Plans</span>
          </div>
        </div>
      </section>

      {/* Visual Workflow Section */}
      <section className="landing-features page-wrapper">
        <div className="section-header text-center-header">
          <span className="badge badge-match">How Food Craft Works</span>
          <h2 className="features-title">Engineered For Everyday Students & Cooks</h2>
          <p className="features-subtitle">From a quick fridge photo to a chef-grade, balanced meal plan in seconds</p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card glass-panel-interactive">
            <div className="feature-icon-box box-amber">
              <Camera size={26} />
            </div>
            <span className="feature-step">Step 01</span>
            <h3 className="feature-card-title">YOLOv8 Vision Input</h3>
            <p className="feature-card-desc">
              Snap a picture of your open fridge, vegetable drawer, or pantry shelf. Our computer vision automatically tags your eggs, vegetables, dairy, and spices.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card glass-panel-interactive">
            <div className="feature-icon-box box-primary">
              <Cpu size={26} />
            </div>
            <span className="feature-step">Step 02</span>
            <h3 className="feature-card-title">SBERT + FAISS Matching</h3>
            <p className="feature-card-desc">
              Sentence-BERT semantically understands ingredient harmonies and FAISS queries millions of real recipes with measured weights and steps without hallucinating.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card glass-panel-interactive">
            <div className="feature-icon-box box-green">
              <Utensils size={26} />
            </div>
            <span className="feature-step">Step 03</span>
            <h3 className="feature-card-title">Dietary Tailoring</h3>
            <p className="feature-card-desc">
              Filter by Regional tastes (South Indian, North Indian, Asian), Gym high-protein goals, low-sugar diabetic regimens, or low-salt cardiovascular diets.
            </p>
          </div>
        </div>
      </section>

      {/* Mobile-Ready Banner */}
      <section className="mobile-showcase page-wrapper">
        <div className="mobile-banner glass-panel">
          <div className="mobile-banner-content">
            <span className="badge badge-gym">Mobile Optimized</span>
            <h2>Cook In Your Kitchen With Ease</h2>
            <p>
              Designed mobile-first with smooth gesture navigation, bottom tab controls, and clear step-by-step cooking timers you can follow hands-free.
            </p>
            <div className="banner-buttons">
              <Link to="/login" className="btn-primary" id="landing-login-btn">
                <span>Sign In / Register</span>
              </Link>
              <Link to="/meal-plan" className="btn-secondary" id="landing-plan-btn">
                <span>View Weekly Plan</span>
              </Link>
            </div>
          </div>
          <div className="mobile-banner-badge-preview">
            <div className="floating-ui-card glass-panel">
              <div className="floating-card-header">
                <span className="status-dot"></span>
                <span>YOLOv8 Vision Online</span>
              </div>
              <p className="floating-card-text">5 items recognized • 96% Match</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
