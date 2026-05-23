// ProductCard.jsx — Amazon-faithful product card
//
// Visual layout (top to bottom) matches Amazon.in exactly:
//   Image (with heart wishlist) → Brand → Title (2-line clamp)
//   → Stars + review count → "X+ bought in past month"
//   → Price (₹ whole) + MRP strikethrough + discount %
//   → Prime badge + delivery line → Add to Cart button

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import StarRating from '../StarRating/StarRating.jsx';
import './ProductCard.css';

// Format price Indian style: 134900 → "1,34,900"
const formatPrice = (price) => {
  const num = parseFloat(price);
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

// Get primary image url from product.images array
const getPrimaryImage = (images = []) => {
  if (!images || images.length === 0) return 'https://via.placeholder.com/300x300?text=No+Image';
  const primary = images.find(img => img.is_primary);
  return (primary || images[0]).url;
};

// Calculate a "fake" MRP that's ~20-60% higher than the actual price
// Amazon shows MRP vs actual price to show savings
const getMRP = (price) => {
  const p = parseFloat(price);
  // Use price id-based seed for consistent but varied discounts per product
  const discountPct = 15 + (Math.floor(p) % 45); // 15-60% off
  const mrp = Math.round(p / (1 - discountPct / 100));
  return { mrp, discountPct };
};

// Get a "bought in past month" count — simulated from review_count
const getBoughtCount = (reviewCount) => {
  if (!reviewCount || reviewCount < 5) return null;
  // Scale: 10 reviews ≈ 50+, 100 reviews ≈ 500+, 1000 reviews ≈ 5000+
  const count = Math.floor(reviewCount * 4.8);
  if (count < 50) return null;
  // Round to nearest clean number
  const rounded = Math.round(count / 50) * 50;
  return `${rounded.toLocaleString('en-IN')}+`;
};

// Get delivery date string (tomorrow / Sat, 30 May style)
const getDeliveryDate = (deliveryDays) => {
  const today = new Date();
  const daysToAdd = typeof deliveryDays === 'number' ? deliveryDays : 2;
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + daysToAdd);

  const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][deliveryDate.getDay()];
  const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][deliveryDate.getMonth()];

  if (daysToAdd === 0) return 'Today';
  if (daysToAdd === 1) return 'Tomorrow';
  return `${dayName}, ${deliveryDate.getDate()} ${monthName}`;
};

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  if (!product) return null;

  const imageUrl    = getPrimaryImage(product.images);
  const inStock     = product.stock_qty > 0;
  const isWishlisted = isInWishlist(product.id);
  const isPrime     = !!product.is_prime;
  const { mrp, discountPct } = getMRP(product.price);
  const boughtCount = getBoughtCount(product.review_count);
  const deliveryDate = getDeliveryDate(product.delivery_days);

  // Brand: extract from product name (first word(s) before '—' or first word if caps)
  const brandName = (() => {
    if (product.brand) return product.brand;
    const nameParts = product.name.split(/[—–-]/);
    if (nameParts.length > 1) return nameParts[nameParts.length - 1].trim();
    // Use first word if it looks like a brand (first letter caps, short)
    const firstWord = product.name.split(' ')[0];
    if (firstWord.length <= 12 && firstWord[0] === firstWord[0].toUpperCase()) return firstWord;
    return '';
  })();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || !inStock) return;

    setAdding(true);
    await addToCart(product.id, 1);
    setTimeout(() => setAdding(false), 1500);
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistLoading) return;

    setWishlistLoading(true);
    const res = await toggleWishlist(product.id);
    setWishlistLoading(false);

    if (res && res.requireAuth) {
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card"
      aria-label={product.name}
    >
      {/* ── Image area — flush edges, no padding, clean white ── */}
      <div className="product-card__img-wrap">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-card__img"
          loading="lazy"
          onError={e => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
        />

        {/* Heart Wishlist button — hidden until hover (CSS opacity) */}
        <button
          className={`product-card__wishlist-btn ${isWishlisted ? 'active' : ''} ${wishlistLoading ? 'loading' : ''}`}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isWishlisted ? 'var(--color-wishlist-red, #B12704)' : 'none'}
            stroke={isWishlisted ? 'var(--color-wishlist-red, #B12704)' : '#6f7373'}
            strokeWidth="2.2"
            className="product-card__heart-icon"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      {/* ── All text + button content in padded body zone ───── */}
      <div className="product-card__body">

        {/* Brand name */}
        {brandName && (
          <p className="product-card__brand">{brandName}</p>
        )}

        {/* Product title — 2-line clamp */}
        <p className="product-card__title">{product.name}</p>

        {/* Star rating + review count */}
        <div className="product-card__rating">
          <StarRating
            rating={parseFloat(product.rating)}
            count={product.review_count}
            size={13}
          />
        </div>

        {/* "X+ bought in past month" social proof */}
        {boughtCount && (
          <p className="product-card__bought">{boughtCount} bought in past month</p>
        )}

        {/* Price: ₹actual + M.R.P. strikethrough + discount % */}
        <div className="product-card__price-block">
          <div className="product-card__price-row">
            <span className="product-card__price-symbol">₹</span>
            <span className="product-card__price-whole">{formatPrice(product.price)}</span>
          </div>
          <div className="product-card__mrp-row">
            <span className="product-card__mrp-label">M.R.P: </span>
            <span className="product-card__mrp">₹{formatPrice(mrp)}</span>
            <span className="product-card__discount"> ({discountPct}% off)</span>
          </div>
        </div>

        {/* Prime badge + FREE delivery date */}
        <div className="product-card__prime-delivery">
          {isPrime && (
            <span className="product-card__prime-badge">
              <svg viewBox="0 0 54 15" className="product-card__prime-logo" aria-label="Prime">
                <text x="1" y="12" fontFamily="Arial" fontWeight="bold" fontStyle="italic" fontSize="13" fill="#00A8E0">prime</text>
              </svg>
            </span>
          )}
          <span className="product-card__delivery">
            FREE delivery <strong>{deliveryDate}</strong>
          </span>
        </div>

        {/* Out of stock notice */}
        {!inStock && <p className="product-card__oos">Currently unavailable</p>}

        {/* Add to Cart — always visible pill button */}
        {inStock && (
          <button
            className={`product-card__add-btn ${adding ? 'adding' : ''}`}
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            id={`add-to-cart-${product.id}`}
          >
            {adding ? '✓ Added to Cart' : 'Add to cart'}
          </button>
        )}
      </div>
    </Link>

  );
}
