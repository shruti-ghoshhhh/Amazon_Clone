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
            <div className="logo-main">
              <svg className="amazon-logo-svg" viewBox="0 0 603 182" fill="currentColor">
                <path d="m 374.00642,142.18404 c -34.99948,25.79739 -85.72909,39.56123 -129.40634,39.56123 -61.24255,0 -116.37656,-22.65135 -158.08757,-60.32496 -3.2771,-2.96252 -0.34083,-6.9999 3.59171,-4.69283 45.01431,26.19064 100.67269,41.94697 158.16623,41.94697 38.774689,0 81.4295,-8.02237 120.6499,-24.67006 5.92501,-2.51683 10.87999,3.88009 5.08607,8.17965" fill="#FF9900" />
                <path d="m 388.55678,125.53635 c -4.45688,-5.71527 -29.57261,-2.70033 -40.84585,-1.36327 -3.43442,0.41947 -3.95874,-2.56925 -0.86517,-4.71905 20.00346,-14.07844 52.82696,-10.01483 56.65462,-5.2958 3.82764,4.74526 -0.99624,37.64741 -19.79373,53.35128 -2.88385,2.41195 -5.63662,1.12734 -4.35198,-2.07113 4.2209,-10.53917 13.68519,-34.16054 9.20211,-39.90203" fill="#FF9900" />
                <path d="M 348.49744,20.06598 V 6.38079 c 0,-2.07113 1.57301,-3.46062 3.46062,-3.46062 h 61.26875 c 1.96628,0 3.53929,1.41571 3.53929,3.46062 v 11.71893 c -0.0262,1.96626 -1.67788,4.53551 -4.61418,8.59912 l -31.74859,45.32893 c 11.79759,-0.28837 24.25059,1.46814 34.94706,7.49802 2.41195,1.36327 3.06737,3.35575 3.25089,5.32203 V 99.4506 c 0,1.99248 -2.20222,4.32576 -4.5093,3.1198 -18.84992,-9.88376 -43.887,-10.95865 -64.72939,0.10487 -2.12356,1.15354 -4.35199,-1.15354 -4.35199,-3.14602 V 85.66054 c 0,-2.22843 0.0262,-6.02989 2.25463,-9.41186 l 36.78224,-52.74829 h -32.01076 c -1.96626,0 -3.53927,-1.38948 -3.53927,-3.43441" />
                <path d="m 124.99883,105.45424 h -18.64017 c -1.78273,-0.13107 -3.19845,-1.46813 -3.32954,-3.17224 V 6.61676 c 0,-1.91383 1.59923,-3.43442 3.59171,-3.43442 h 17.38176 c 1.80898,0.0786 3.25089,1.46814 3.38199,3.19845 v 12.50545 h 0.34082 c 4.53551,-12.08598 13.05597,-17.7226 24.53896,-17.7226 11.66649,0 18.95477,5.63662 24.19814,17.7226 4.5093,-12.08598 14.76008,-17.7226 25.74495,-17.7226 7.81262,0 16.35931,3.22467 21.57646,10.46052 5.89879,8.04857 4.69281,19.74128 4.69281,29.99208 l -0.0262,60.37739 c 0,1.91383 -1.59923,3.46061 -3.59171,3.46061 h -18.61397 c -1.86138,-0.13107 -3.35574,-1.62543 -3.35574,-3.46061 V 51.29025 c 0,-4.03739 0.36702,-14.10466 -0.52434,-17.93233 -1.38949,-6.42311 -5.55797,-8.23209 -10.95865,-8.23209 -4.5093,0 -9.22833,3.01494 -11.14216,7.83885 -1.91383,4.8239 -1.73031,12.89867 -1.73031,18.32557 v 50.70338 c 0,1.91383 -1.59923,3.46061 -3.59171,3.46061 h -18.61395 c -1.88761,-0.13107 -3.35576,-1.62543 -3.35576,-3.46061 L 152.946,51.29025 c 0,-10.67025 1.75651,-26.37415 -11.48298,-26.37415 -13.39682,0 -12.87248,15.31063 -12.87248,26.37415 v 50.70338 c 0,1.91383 -1.59923,3.46061 -3.59171,3.46061" />
                <path d="m 469.51439,1.16364 c 27.65877,0 42.62858,23.75246 42.62858,53.95427 0,29.17934 -16.54284,52.32881 -42.62858,52.32881 -27.16066,0 -41.94697,-23.75246 -41.94697,-53.35127 0,-29.78234 14.96983,-52.93181 41.94697,-52.93181 m 0.15729,19.53156 c -13.73761,0 -14.60278,18.71881 -14.60278,30.38532 0,11.69271 -0.18352,36.65114 14.44549,36.65114 14.44548,0 15.12712,-20.13452 15.12712,-32.40403 0,-8.07477 -0.34082,-17.72257 -2.779,-25.3779 -2.09735,-6.65906 -6.26581,-9.25453 -12.19083,-9.25453" />
                <path d="M 548.00762,105.45424 H 529.4461 c -1.86141,-0.13107 -3.35577,-1.62543 -3.35577,-3.46061 l -0.0262,-95.69149 c 0.1573,-1.75653 1.7041,-3.1198 3.59171,-3.1198 h 17.27691 c 1.62543,0.0786 2.96249,1.17976 3.32954,2.67412 v 14.62899 h 0.3408 c 5.21717,-13.0822 12.53165,-19.32181 25.40412,-19.32181 8.36317,0 16.51662,3.01494 21.75999,11.27324 4.87633,7.65532 4.87633,20.5278 4.87633,29.78233 v 60.22011 c -0.20973,1.67786 -1.75653,3.01492 -3.59169,3.01492 h -18.69262 c -1.70411,-0.13107 -3.11982,-1.38948 -3.30332,-3.01492 V 50.47753 c 0,-10.46052 1.20597,-25.77117 -11.66651,-25.77117 -4.5355,0 -8.70399,3.04117 -10.77512,7.65532 -2.62167,5.84637 -2.96249,11.66651 -2.96249,18.11585 v 51.5161 c -0.0262,1.91383 -1.65166,3.46061 -3.64414,3.46061" />
                <use xlinkHref="#path30" transform="translate(244.36719)" />
                <path id="path30" d="M 55.288261,59.75829 V 55.7209 c -13.475471,0 -27.711211,2.88385 -27.711211,18.77125 0,8.04857 4.16847,13.50169 11.32567,13.50169 5.24337,0 9.93618,-3.22467 12.8987,-8.46805 3.670341,-6.44935 3.486841,-12.50544 3.486841,-19.7675 m 18.79747,45.43378 c -1.23219,1.10111 -3.01495,1.17976 -4.40444,0.4457 -6.18716,-5.1385 -7.28828,-7.52423 -10.69647,-12.42678 -10.224571,10.4343 -17.460401,13.55409 -30.726141,13.55409 -15.67768,0 -27.89471,-9.67401 -27.89471,-29.04824 0,-15.12713 8.20587,-25.43035 19.87236,-30.46398 10.1197,-4.45688 24.25058,-5.24337 35.051931,-6.47556 v -2.41195 c 0,-4.43066 0.34082,-9.67403 -2.25465,-13.50167 -2.280881,-3.43442 -6.632861,-4.85013 -10.460531,-4.85013 -7.10475,0 -13.44924,3.64414 -14.99603,11.19459 -0.31461,1.67789 -1.5468,3.32955 -3.22467,3.4082 L 6.26276,32.67628 C 4.74218,32.33548 3.0643,31.10327 3.48377,28.76999 7.65225,6.85271 27.44596,0.24605 45.16856,0.24605 c 9.071011,0 20.921021,2.41195 28.078221,9.28076 9.07104,8.46804 8.20587,19.7675 8.20587,32.06321 v 29.04826 c 0,8.73022 3.61794,12.55786 7.02613,17.27691 1.20597,1.67786 1.46814,3.69656 -0.05244,4.95497 -3.80144,3.17225 -10.56538,9.07104 -14.28819,12.37436 l -0.05242,-0.0525" />
              </svg>
              <span className="logo-in-suffix">.in</span>
            </div>
            <span className="logo-prime-badge">prime</span>
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
