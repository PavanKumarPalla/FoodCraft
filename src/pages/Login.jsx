// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Utensils, Mail, Lock, ArrowRight, CheckCircle, 
  AlertCircle, KeyRound, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Reset Modal / Mode State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const navigate = useNavigate();
  const { login } = useFoodCraft();

  // Handle Standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
  };

  // Handle Fast Demo Login
  const handleDemoLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);
    await login({ email: 'demo@foodcraft.ai', password: 'password123' });
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  // STEP 1 of Reset: Send Reset OTP to Email
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset code.');
      }

      setSuccessMessage(data.message);
      setResetStep(2);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2 of Reset: Verify OTP & Update Password in MongoDB
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetOtp,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccessMessage('🎉 Password updated successfully! Please sign in with your new password.');
      setEmail(resetEmail);
      setIsResetMode(false);
      setResetStep(1);
      setResetOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-panel animate-fade-in">
        {/* Brand */}
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Utensils size={24} />
          </div>
          <h1 className="auth-title">
            {isResetMode ? 'Reset Password' : 'Sign In'}
          </h1>
          <p className="auth-subtitle">
            {isResetMode
              ? resetStep === 1
                ? 'Enter your account email to receive a 6-digit code'
                : `Enter the code sent to ${resetEmail}`
              : 'Welcome back to FoodCraft'}
          </p>
        </div>

        {/* Global Feedback Alerts */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.75rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.75rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={17} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= NORMAL LOGIN VIEW ================= */}
        {!isResetMode && (
          <>
            {/* Demo Fast Login Pill */}
            <div className="demo-login-box" onClick={handleDemoLogin} id="quick-demo-login-btn">
              <div className="demo-box-left">
                <CheckCircle size={17} className="demo-check-icon" />
                <div>
                  <span className="demo-title">Fast Demo Access</span>
                  <span className="demo-desc">Instant 1-click demo login</span>
                </div>
              </div>
              <ArrowRight size={15} />
            </div>

            <div className="auth-divider">
              <span>or sign in with email / phone</span>
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-identifier">Email or Mobile Number</label>
                <div className="input-icon-wrapper">
                  <Mail size={16} className="field-icon" />
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    placeholder="name@example.com or phone"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-between">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setResetEmail(email);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="forgot-password-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-icon-wrapper">
                  <Lock size={16} className="field-icon" />
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
                <span>{isSubmitting ? 'Signing in...' : 'Sign In to FoodCraft'}</span>
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="auth-footer">
              <span>Don't have an account yet?</span>
              <Link to="/register" className="auth-switch-link" id="go-to-register-link">Create Account</Link>
            </div>
          </>
        )}

        {/* ================= FORGOT / RESET PASSWORD VIEW ================= */}
        {isResetMode && (
          <>
            {resetStep === 1 && (
              <form className="auth-form" onSubmit={handleSendResetOtp}>
                <div className="form-group">
                  <label htmlFor="reset-email">Account Email Address</label>
                  <div className="input-icon-wrapper">
                    <Mail size={17} className="field-icon" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      placeholder="pavan@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary btn-glow auth-submit-btn" 
                  disabled={isSubmitting}
                  id="send-reset-otp-btn"
                >
                  <span>{isSubmitting ? 'Sending Reset Code...' : 'Send Reset Code'}</span>
                  <ArrowRight size={18} />
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => {
                      setIsResetMode(false);
                      setErrorMessage('');
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="reset-otp">6-Digit Verification Code</label>
                  <div className="input-icon-wrapper">
                    <KeyRound size={17} className="field-icon" />
                    <input
                      id="reset-otp"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
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
                    Check your email inbox for the reset code sent from <strong>pavanpalla1916@gmail.com</strong>
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <div className="input-icon-wrapper">
                    <Lock size={17} className="field-icon" />
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <div className="input-icon-wrapper">
                    <Lock size={17} className="field-icon" />
                    <input
                      id="confirm-new-password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary btn-glow auth-submit-btn" 
                  disabled={isSubmitting || resetOtp.length !== 6}
                  id="confirm-reset-btn"
                >
                  <span>{isSubmitting ? 'Updating Password...' : 'Reset Password & Save'}</span>
                  <ShieldCheck size={18} />
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.82rem' }}
                    onClick={() => setResetStep(1)}
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.82rem', color: '#10b981' }}
                    onClick={handleSendResetOtp}
                    disabled={isSubmitting}
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
