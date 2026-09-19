// src/pages/Login.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Utensils, Mail, Lock, ArrowRight, 
  AlertCircle, KeyRound, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { useFoodCraft } from '../context/FoodCraftContext';
import './Login.css';

// Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '916846769559-1phshi0i2s2u4h6f3lejq5ntibc07ecs.apps.googleusercontent.com';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password Reset Modal / Mode State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const navigate = useNavigate();
  const { login, googleLogin } = useFoodCraft();
  const tokenClientRef = useRef(null);

  // Handle OAuth Token response & verify profile with backend
  const handleTokenResponse = useCallback(async (tokenResponse) => {
    if (tokenResponse.error) {
      setGoogleLoading(false);
      if (tokenResponse.error !== 'popup_closed_by_user') {
        setErrorMessage('Google sign-in was cancelled or failed.');
      }
      return;
    }

    try {
      setGoogleLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Fetch user profile securely from Google OpenID userinfo endpoint
      const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userInfo = await res.json();

      if (!userInfo.email) {
        throw new Error('Could not retrieve email from your Google account.');
      }

      // Check with MongoDB backend
      const result = await googleLogin({
        email: userInfo.email,
        name: userInfo.name || '',
        googleId: userInfo.sub,
        avatar: userInfo.picture || '',
      });

      setGoogleLoading(false);

      if (!result.success) {
        setErrorMessage(result.message || 'Google sign-in failed.');
        return;
      }

      if (result.newUser) {
        // User not in DB → redirect to register with Google details prefilled
        setSuccessMessage('Redirecting to create your account...');
        setTimeout(() => {
          navigate('/register', {
            state: {
              fromGoogle: true,
              googleUser: result.googleUser,
            },
          });
        }, 600);
      } else {
        // Existing user in DB → direct dashboard access
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Google profile fetch error:', err);
      setGoogleLoading(false);
      setErrorMessage(err.message || 'Failed to retrieve Google profile.');
    }
  }, [googleLogin, navigate]);

  // Initialize Google Token Client
  useEffect(() => {
    if (isResetMode) return;

    const setupClient = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            callback: handleTokenResponse,
          });
        } catch (err) {
          console.error('Failed to init Google tokenClient:', err);
        }
      }
    };

    if (window.google?.accounts?.oauth2) {
      setupClient();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          setupClient();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isResetMode, handleTokenResponse]);

  // Click handler for Custom Google Button
  const handleGoogleSignIn = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (tokenClientRef.current) {
      setGoogleLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: handleTokenResponse,
        });
        tokenClientRef.current = client;
        setGoogleLoading(true);
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.error('Error on dynamic tokenClient init:', err);
      }
    }

    setErrorMessage('Google Sign-In is initializing. Please try again in a moment.');
  };

  // Handle Standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
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
            {/* Google Sign-In Button (Clean & Professional, No Email Exposed) */}
            <div className="google-signin-section">
              <button
                type="button"
                className="custom-google-btn"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                id="google-signin-btn"
              >
                {googleLoading ? (
                  <>
                    <div className="google-spinner"></div>
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
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
