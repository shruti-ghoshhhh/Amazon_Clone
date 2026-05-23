// Navbar.jsx — Amazon-faithful two-row navigation bar
//
// Row 1 (dark #131A22): Logo | Deliver to | Search | Account | Orders | Cart
// Row 2 (mid #232F3E) : ☰ All | Today's Deals | Customer Service | ...
//
// This component:
//   - Uses useCart() to get real-time cart item count for the badge
//   - Uses useNavigate() to programmatically navigate on search submit
//   - Fetches categories from the API to populate the search dropdown
//   - Is sticky (position: fixed) so it stays visible on scroll

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import './Navbar.css';

// SVG icons — inline keeps bundle size small (no icon library needed)
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const CartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="white">
    <rect width="16" height="2"/><rect y="6" width="16" height="2"/><rect y="12" width="16" height="2"/>
  </svg>
);

export default function Navbar() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery]           = useState(searchParams.get('search') || '');
  const [selectedCat, setSelectedCat] = useState('All');
  const [categories, setCategories] = useState([]);

  // HTML5 Geolocation State
  const [locationName, setLocationName] = useState(() => localStorage.getItem('deliverLocation') || 'Jalandhar 144411');

  // Language state & list
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('preferredLanguage') || 'EN');

  const LANGUAGES = [
    { code: 'EN', name: 'English', nativeName: 'English' },
    { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'TA', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'TE', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'KN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ML', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'BN', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'MR', name: 'Marathi', nativeName: 'मराठी' },
  ];

  const handleLanguageChange = (code) => {
    setSelectedLang(code);
    localStorage.setItem('preferredLanguage', code);
  };

  // Fetch categories for the search dropdown
  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  // Sync search input with URL ?search= param
  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Request/update user location using HTML5 Geolocation API on mount
  useEffect(() => {
    if (navigator.geolocation && !localStorage.getItem('deliverLocation')) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Using OpenStreetMap's free public Nominatim endpoint for reverse geocoding
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const data = await res.json();
            const address = data.address || {};
            const city = address.city || address.town || address.village || address.suburb || 'Jalandhar';
            const postcode = address.postcode || '144411';
            
            const locationStr = `${city} ${postcode}`;
            setLocationName(locationStr);
            localStorage.setItem('deliverLocation', locationStr);
          } catch (e) {
            console.warn('⚠️ [Navbar Geolocation] Reverse Lookup failed:', e);
          }
        },
        (error) => {
          console.warn('⚠️ [Navbar Geolocation] Blocked or timed out:', error);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Manual Trigger to update/retrieve location on click
  const handleRequestLocation = (e) => {
    e.stopPropagation();
    if (navigator.geolocation) {
      setLocationName('Locating...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const data = await res.json();
            const address = data.address || {};
            const city = address.city || address.town || address.village || address.suburb || 'Jalandhar';
            const postcode = address.postcode || '144411';
            
            const locationStr = `${city} ${postcode}`;
            setLocationName(locationStr);
            localStorage.setItem('deliverLocation', locationStr);
          } catch (e) {
            setLocationName('Jalandhar 144411');
          }
        },
        () => {
          setLocationName('Jalandhar 144411');
        }
      );
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (selectedCat !== 'All') {
      const cat = categories.find(c => c.name === selectedCat);
      if (cat) params.set('category', cat.slug);
    }
    navigate(`/products?${params.toString()}`);
  };

  const itemCount = cart.item_count || 0;

  return (
    <header className="navbar">
      {/* ── Row 1: Primary Nav ────────────────────────────── */}
      <div className="navbar-top">

        {/* Logo with high-fidelity Prime Brand Overlay */}
        <Link to="/" className="navbar-logo" aria-label="Amazon Clone Home">
          <div className="logo-container">
            <span className="logo-text">amazon<span>.in</span></span>
            <span className="logo-prime">prime</span>
          </div>
        </Link>

        {/* Deliver to Widget (Interactive Geolocation) */}
        <div className="deliver-to" onClick={handleRequestLocation} title="Click to update to real-time location">
          <span className="deliver-top">Deliver to {user ? user.name.split(' ')[0] : 'Shruti'}</span>
          <span className="deliver-bottom">
            <LocationIcon />
            {locationName}
          </span>
        </div>

        {/* Search bar */}
        <form className="navbar-search" onSubmit={handleSearch} role="search">
          {/* Category filter dropdown */}
          <select
            className="search-category"
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            aria-label="Search category"
          >
            <option value="All">All</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          {/* Search input */}
          <input
            type="text"
            className="search-input"
            placeholder="Search Amazon.in"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search products"
            id="navbar-search-input"
          />

          {/* Search button */}
          <button className="search-btn" type="submit" aria-label="Submit search">
            <SearchIcon />
          </button>
        </form>

        {/* Flag + Language Widget (Interactive Dropdown) */}
        <div className="nav-item lang-widget lang-dropdown-trigger hide-mobile" title="Language selection">
          <span className="flag-icon">🇮🇳</span>
          <span className="lang-text font-bold">{selectedLang}</span>
          <span className="lang-arrow">▾</span>
          
          <div className="lang-dropdown">
            <div className="lang-dropdown-header">
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Change Language</span>
              <span className="text-xs text-secondary">Select your preferred language:</span>
            </div>
            <div className="dropdown-divider" />
            <div className="lang-options-list">
              {LANGUAGES.map(lang => (
                <label key={lang.code} className="lang-option-label" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="preferred_language"
                    value={lang.code}
                    checked={selectedLang === lang.code}
                    onChange={() => handleLanguageChange(lang.code)}
                    className="lang-radio-input"
                  />
                  <span className="lang-option-text">
                    <span className="lang-native">{lang.nativeName}</span> - {lang.name}
                  </span>
                </label>
              ))}
            </div>
            <div className="dropdown-divider" />
            <div className="lang-dropdown-footer">
              <span className="text-xs text-secondary" style={{ display: 'block', padding: '4px 0' }}>
                🇮🇳 You are shopping on Amazon.in
              </span>
            </div>
          </div>
        </div>

        {/* Account & Lists */}
        <div className="nav-item account-dropdown-trigger">
          <span className="nav-item-top">Hello, {user ? user.name.split(' ')[0] : 'sign in'}</span>
          <span className="nav-item-bottom">Account &amp; Lists ▾</span>
          
          <div className="account-dropdown">
            {!user ? (
              <div className="dropdown-signin-prompt">
                <Link to="/login" className="btn btn-buy dropdown-signin-btn">Sign in</Link>
                <p className="text-xs">New customer? <Link to="/signup" className="auth-link">Start here.</Link></p>
              </div>
            ) : (
              <div className="dropdown-user-header">
                <span className="font-bold text-primary">Hello, {user.name}</span>
                <span className="text-xs text-secondary">{user.email}</span>
              </div>
            )}
            <div className="dropdown-divider" />
            <div className="dropdown-columns-wrap">
              <div className="dropdown-col">
                <h3>Your Lists</h3>
                <Link to="/wishlist">Your Wish List</Link>
              </div>
              <div className="dropdown-divider-v" />
              <div className="dropdown-col">
                <h3>Your Account</h3>
                <Link to="/orders">Your Orders</Link>
                {user && (
                  <button onClick={logout} className="dropdown-logout-btn">
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Returns & Orders */}
        <Link to="/orders" className="nav-item">
          <span className="nav-item-top">Returns</span>
          <span className="nav-item-bottom">&amp; Orders</span>
        </Link>

        {/* Cart */}
        <Link to="/cart" className="cart-nav" aria-label={`Cart with ${itemCount} items`}>
          <div className="cart-icon-wrap">
            <CartIcon />
            <span className="cart-count" aria-live="polite">{itemCount}</span>
          </div>
          <span className="cart-label">Cart</span>
        </Link>
      </div>

      {/* ── Row 2: Secondary Nav ──────────────────────────── */}
      <nav className="navbar-bottom" aria-label="Department navigation">
        <Link to="/products" className="nav-link bold">
          <MenuIcon />
          All
        </Link>

        <Link to="/products?sort=newest"        className="nav-link">Today's Deals</Link>
        <Link to="/orders"                       className="nav-link">Customer Service</Link>
        <Link to="/products?category=electronics" className="nav-link">Electronics</Link>
        <Link to="/products?category=clothing"    className="nav-link">Fashion</Link>
        <Link to="/products?category=home-kitchen"className="nav-link">Home &amp; Kitchen</Link>
        <Link to="/products?category=books"       className="nav-link">Books</Link>
        <Link to="/products?category=sports-outdoors" className="nav-link">Sports</Link>
        <Link to="/products?category=beauty"      className="nav-link">Beauty</Link>
        <Link to="/products?sort=rating"          className="nav-link">Best Sellers</Link>
      </nav>
    </header>
  );
}
