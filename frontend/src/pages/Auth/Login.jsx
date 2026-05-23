// Login.jsx — Amazon.in Faithful Login Screen
//
// This component replicates Amazon's official login page:
//   - Centralized Amazon Logo (navigating back home)
//   - White bordered login box with dense typography
//   - Custom input fields with amber focused shadows
//   - Complete validation error alerts matching the brand's style
//   - "New to Amazon? Create your account" horizontal divider button

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirection target after login
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate(redirect);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container fade-in">
      {/* Amazon Logo */}
      <Link to="/" className="auth-logo" aria-label="Amazon Home">
        <span className="logo-dark">amazon<span className="logo-suffix">.in</span></span>
      </Link>

      {/* Main Login Box */}
      <div className="auth-box">
        <h1 className="auth-box-title">Sign in</h1>

        {/* Error Alert Box */}
        {error && (
          <div className="auth-alert alert-error" role="alert">
            <div className="auth-alert-icon">⚠️</div>
            <div className="auth-alert-body">
              <h4 className="auth-alert-title">There was a problem</h4>
              <p className="auth-alert-text">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email input group */}
          <div className="auth-form-group">
            <label htmlFor="login-email">Email or mobile phone number</label>
            <input
              type="email"
              id="login-email"
              className="input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
              required
            />
          </div>

          {/* Password input group */}
          <div className="auth-form-group">
            <div className="auth-label-row">
              <label htmlFor="login-password">Password</label>
              <a href="#" className="auth-link text-xs">Forgot password?</a>
            </div>
            <input
              type="password"
              id="login-password"
              className="input auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-buy auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Notice disclosures */}
        <p className="auth-disclosure text-xs">
          By continuing, you agree to Amazon's <a href="#" className="auth-link">Conditions of Use</a> and <a href="#" className="auth-link">Privacy Notice</a>.
        </p>

        {/* Help section */}
        <details className="auth-help-details">
          <summary className="auth-help-summary text-xs">Need help?</summary>
          <div className="auth-help-content text-xs">
            <a href="#" className="auth-link block">Forgot your password?</a>
            <a href="#" className="auth-link block">Other issues with Sign-In</a>
          </div>
        </details>
      </div>

      {/* Account Signup Divider */}
      <div className="auth-divider">
        <h5>New to Amazon?</h5>
      </div>

      {/* Redirect Link button */}
      <Link
        to={`/signup?redirect=${encodeURIComponent(redirect)}`}
        className="btn btn-outline auth-signup-btn"
      >
        Create your Amazon account
      </Link>

      {/* Mini footer links */}
      <footer className="auth-footer text-xs">
        <div className="auth-footer-links">
          <a href="#" className="auth-link">Conditions of Use</a>
          <a href="#" className="auth-link">Privacy Notice</a>
          <a href="#" className="auth-link">Help</a>
        </div>
        <p className="auth-footer-copyright">
          © 1996-2026, Amazon.com, Inc. or its affiliates
        </p>
      </footer>
    </div>
  );
}
