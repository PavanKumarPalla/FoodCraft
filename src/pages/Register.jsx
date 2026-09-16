// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Utensils, Mail, Lock, User, Phone, ArrowRight, AlertCircle, 
  CheckCircle2, ShieldCheck, KeyRound 
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Login.css';

export default function Register() {
  // Step tracker: 1 = Details (Name, Email, Phone, Goal), 2 = Verify OTP, 3 = Password section (unlocked ONLY after OTP verified)
  const [step, setStep] = useState(1);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dietaryGoal, setDietaryGoal] = useState('High Protein / Gym Muscle Gain');

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUserProfile } = useFoodCraft();

  // STEP 1: Send OTP to User's Email (checks duplicate Email & Phone in MongoDB)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Phone validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code.');
      }

      setSuccessMessage(data.message);
      if (data.fallbackOtp) {
        setOtp(data.fallbackOtp);
      }
      setStep(2);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify the 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired OTP.');
      }

      setSuccessMessage('✓ Email verified! Please create your password below to finish.');
      setStep(3); // Unlocks the password section
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Complete Registration with Password & Save to MongoDB Atlas
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          otp,
          password,
          dietaryType: dietaryGoal.includes('Vegetarian') ? 'Veg' : 'All',
          healthGoals: [dietaryGoal],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Save token and user
      if (data.token) {
        localStorage.setItem('foodcraft_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('foodcraft_user', JSON.stringify(data.user));
        if (data.user.profile) {
          setUserProfile(prev => ({ ...prev, name: data.user.name, ...data.user.profile }));
        }
      }

      setSuccessMessage('🎉 Account successfully created! Check your email for a welcome message.');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-panel animate-fade-in">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Utensils size={24} />
          </div>
          <h1 className="auth-title">Join Food Craft</h1>
          <p className="auth-subtitle">
            {step === 1 && 'Enter your details to receive an email verification code'}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && 'Email verified! Set a password to complete your account'}
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          margin: '0.35rem 0 0.85rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: step >= 1 ? '#10b981' : '#64748b',
            fontWeight: 600
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: step >= 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              border: `1px solid ${step >= 1 ? '#10b981' : '#64748b'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>1</span>
            Details
          </div>
          <div style={{ width: '20px', height: '1px', background: step >= 2 ? '#10b981' : '#334155' }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: step >= 2 ? '#10b981' : '#64748b',
            fontWeight: 600
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: step >= 2 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              border: `1px solid ${step >= 2 ? '#10b981' : '#64748b'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>2</span>
            Verify OTP
          </div>
          <div style={{ width: '20px', height: '1px', background: step >= 3 ? '#10b981' : '#334155' }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: step >= 3 ? '#10b981' : '#64748b',
            fontWeight: 600
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: step >= 3 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              border: `1px solid ${step >= 3 ? '#10b981' : '#64748b'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>3</span>
            Password
          </div>
        </div>

        {/* Global Feedback Alerts */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            lineHeight: 1.4
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Details & Send OTP */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
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
              <label htmlFor="reg-phone">Mobile Phone Number</label>
              <div className="input-icon-wrapper">
                <Phone size={17} className="field-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Used for instant phone login or password recovery
              </span>
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
              disabled={isLoading}
              id="send-otp-btn"
            >
              <span>{isLoading ? 'Checking MongoDB & Sending OTP...' : 'Verify Email & Send Code'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Verify 6-digit OTP */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="reg-otp">6-Digit Verification Code</label>
              <div className="input-icon-wrapper">
                <KeyRound size={17} className="field-icon" />
                <input
                  id="reg-otp"
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    letterSpacing: '6px',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Check your inbox or spam for an email from <strong>pavanpalla1916@gmail.com</strong>
              </span>
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-glow auth-submit-btn" 
              disabled={isLoading || otp.length !== 6}
              id="verify-otp-btn"
            >
              <span>{isLoading ? 'Verifying Code...' : 'Verify Code & Proceed'}</span>
              <ShieldCheck size={18} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.82rem', padding: '0.25rem 0.5rem' }}
                onClick={() => setStep(1)}
              >
                ← Edit Details
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.82rem', padding: '0.25rem 0.5rem', color: '#10b981' }}
                onClick={(e) => {
                  setOtp('');
                  handleSendOtp(e);
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : '↻ Send New Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Password Section (Unlocked ONLY after successful OTP verification) */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleCompleteRegistration}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#a7f3d0'
            }}>
              ✓ Email <strong>{email}</strong> & Phone <strong>{phone}</strong> verified.
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Create Password</label>
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
              <label htmlFor="reg-confirm-password">Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock size={17} className="field-icon" />
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-glow auth-submit-btn" 
              disabled={isLoading}
              id="complete-reg-btn"
            >
              <span>{isLoading ? 'Saving Account to MongoDB...' : 'Save & Complete Registration'}</span>
              <CheckCircle2 size={18} />
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-switch-link" id="go-to-login-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
