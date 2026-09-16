// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Login.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dietaryGoal, setDietaryGoal] = useState('High Protein / Gym Muscle Gain');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register } = useFoodCraft();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const result = await register({
      name,
      email,
      password,
      dietaryType: dietaryGoal.includes('Vegetarian') ? 'Veg' : 'All',
      healthGoals: [dietaryGoal],
    });

    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Utensils size={24} />
          </div>
          <h1 className="auth-title">Join Food Craft</h1>
          <p className="auth-subtitle">Personalized meal planning and AI recipe match saved to MongoDB</p>
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

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={17} className="field-icon" />
              <input
                id="reg-name"
                type="text"
                required
                placeholder="Pavan Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={17} className="field-icon" />
              <input
                id="reg-email"
                type="email"
                required
                placeholder="pavan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={17} className="field-icon" />
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-goal">Primary Nutrition Goal</label>
            <select
              id="reg-goal"
              value={dietaryGoal}
              onChange={(e) => setDietaryGoal(e.target.value)}
              className="auth-select"
            >
              <option value="High Protein / Gym Muscle Gain">💪 High Protein / Gym Muscle Gain</option>
              <option value="Vegetarian Healthy Eating">🥗 Pure Vegetarian Healthy Diet</option>
              <option value="Low Sugar / Glycemic Control">🍬 Low Sugar / Diabetic Friendly</option>
              <option value="Low Salt / Cardio Health">🧂 Low Salt / Cardio Health</option>
              <option value="Quick 20-min Budget Bachelor Meals">⏱️ Quick Budget / Student Meals</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn-primary btn-glow auth-submit-btn" 
            disabled={isSubmitting}
            id="register-submit-btn"
          >
            <span>{isSubmitting ? 'Registering on MongoDB...' : 'Complete Registration'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-switch-link" id="go-to-login-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
