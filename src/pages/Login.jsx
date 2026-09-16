// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('pavan.kumar@foodcraft.ai');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 450);
  };

  const handleDemoLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-panel animate-fade-in">
        {/* Brand */}
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Utensils size={24} />
          </div>
          <h1 className="auth-title">Welcome Back to FoodCraft</h1>
          <p className="auth-subtitle">Log in to view your tailored meal plans and saved recipes</p>
        </div>

        {/* Demo Fast Login Pill */}
        <div className="demo-login-box" onClick={handleDemoLogin} id="quick-demo-login-btn">
          <div className="demo-box-left">
            <CheckCircle size={18} className="demo-check-icon" />
            <div>
              <span className="demo-title">Fast Demo Access</span>
              <span className="demo-desc">Click here to log in immediately with student demo account</span>
            </div>
          </div>
          <ArrowRight size={16} />
        </div>

        <div className="auth-divider">
          <span>or log in with email</span>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={17} className="field-icon" />
              <input
                id="login-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-between">
              <label htmlFor="login-password">Password</label>
              <a href="#forgot" className="forgot-password-link">Forgot password?</a>
            </div>
            <div className="input-icon-wrapper">
              <Lock size={17} className="field-icon" />
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="form-check-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn-primary btn-glow auth-submit-btn" 
            disabled={isSubmitting}
            id="login-submit-btn"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Food Craft'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account yet?</span>
          <Link to="/register" className="auth-switch-link" id="go-to-register-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
