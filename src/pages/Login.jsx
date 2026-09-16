// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Mail, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useFoodCraft();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    // Try demo login via backend or fallback to local demo
    const result = await login({ email: 'demo@foodcraft.ai', password: 'password123' });
    setIsSubmitting(false);
    navigate('/dashboard');
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

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

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
              <span className="forgot-password-link">Forgot password?</span>
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
            <span>{isSubmitting ? 'Authenticating with MongoDB...' : 'Sign In to Food Craft'}</span>
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
