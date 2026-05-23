// Signup.jsx — Amazon.in Faithful Registration Screen
//
// This component replicates Amazon's registration page:
//   - Centralized logo navigating back home
//   - Structured input fields for Name, Email, Password, and Password Again
//   - Real-time password length verification (at least 6 characters)
//   - Error messaging blocks for duplicate emails or invalid payloads
//   - "Already have an account? Sign in" dropdown disclosure link

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Auth.css';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirection target after register
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field checks
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Passwords must be at least 6 characters.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match. Please re-enter them.');
      return;
    }

    setSubmitting(true);
    const result = await signup(name, email, password);
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

      {/* Main Registration Box */}
      <div className="auth-box">
        <h1 className="auth-box-title">Create Account</h1>

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
          {/* Name input */}
          <div className="auth-form-group">
            <label htmlFor="signup-name">Your name</label>
            <input
              type="text"
              id="signup-name"
              className="input auth-input"
              placeholder="First and last name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoComplete="name"
              required
            />
          </div>

          {/* Email input */}
          <div className="auth-form-group">
            <label htmlFor="signup-email">Email</label>
            <input
              type="email"
              id="signup-email"
              className="input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
              required
            />
          </div>

          {/* Password input */}
          <div className="auth-form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              type="password"
              id="signup-password"
              className="input auth-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
              required
            />
            <span className="auth-input-help text-xs">ℹ️ Passwords must be at least 6 characters.</span>
          </div>

          {/* Password Confirmation input */}
          <div className="auth-form-group">
            <label htmlFor="signup-confirm">Password again</label>
            <input
              type="password"
              id="signup-confirm"
              className="input auth-input"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-buy auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create your Amazon account'}
          </button>
        </form>

        {/* Notice disclosures */}
        <p className="auth-disclosure text-xs">
          By creating an account, you agree to Amazon's <a href="#" className="auth-link">Conditions of Use</a> and <a href="#" className="auth-link">Privacy Notice</a>.
        </p>

        <div className="auth-box-divider" />

        {/* Signin Redirect block */}
        <div className="auth-signin-link text-xs">
          Already have an account? <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="auth-link font-bold">Sign in ▾</Link>
        </div>
      </div>

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
