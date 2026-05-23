// NeedAnythingElse.jsx — Shown between Cart and Checkout.
//
// TWO carousels:
//   1. "Buy it again"        — products from past orders; falls back to top-rated products.
//   2. "Based on your wishlist" — actual wishlist items; falls back to next set of top-rated products.
//
// Crash-proof: all numeric fields are safely parsed before use.
// Never blank: always shows at least the fallback product lists.

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './NeedAnythingElse.css';

const fmt = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const safeRating = (r) => {
  const num = parseFloat(r);
  return isNaN(num) ? 0 : Math.min(5, Math.max(0, num));
};

const getPrimaryImage = (images = []) => {
  if (!images?.length) return 'https://via.placeholder.com/160?text=No+Image';
  return (images.find(i => i.is_primary) || images[0]).url;
};

// ── Star Rating ────────────────────────────────────────────────
function StarRating({ rating }) {
  const r = safeRating(rating);
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  return (
    <span className="nae-stars">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
      <span className="nae-stars-num"> {r.toFixed(1)}</span>
    </span>
  );
}

// ── Product Card ───────────────────────────────────────────────
function ProductCard({ p, onAdd }) {
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  const price = parseFloat(p.price) || 0;
  const mrp   = (price * 1.6).toFixed(0);
  const disc  = price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const imgUrl = getPrimaryImage(p.images);

  const handleAdd = async () => {
    if (busy) return;
    setBusy(true);
    await onAdd(p.id);
    setBusy(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="nae-card">
      <Link to={`/products/${p.id}`}>
        <img
          src={imgUrl}
          alt={p.name}
          className="nae-card-img"
          onError={e => { e.target.src = 'https://via.placeholder.com/160?text=No+Image'; }}
        />
      </Link>
      <Link to={`/products/${p.id}`} className="nae-card-title">{p.name}</Link>
      <StarRating rating={p.rating} />
      <div className="nae-card-price-row">
        <span className="nae-card-discount">-{disc}%</span>
        <span className="nae-card-price">₹{fmt(price)}</span>
      </div>
      <div className="nae-card-mrp">M.R.P: <s>₹{fmt(mrp)}</s></div>
      <div className="nae-card-delivery">
        <span className="nae-card-prime">prime</span>{' '}
        <span>FREE delivery <strong>Tomorrow</strong></span>
      </div>
      <button
        className={`nae-add-btn ${added ? 'added' : ''}`}
        onClick={handleAdd}
        disabled={busy}
      >
        {added ? '✓ Added' : 'Add to cart'}
      </button>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────
function SkeletonCards({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="nae-card skeleton-card">
          <div className="skeleton" style={{ height: 160, borderRadius: 4 }} />
          <div className="skeleton skel-line" style={{ width: '90%', marginTop: 10 }} />
          <div className="skeleton skel-line" style={{ width: '60%' }} />
          <div className="skeleton skel-line" style={{ width: '40%' }} />
          <div className="skeleton" style={{ height: 30, marginTop: 'auto', borderRadius: 20 }} />
        </div>
      ))}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function NeedAnythingElse() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  // Fallback pool of top-rated products
  const [topProducts, setTopProducts] = useState([]);
  // Products extracted from past orders (for "Buy it again")
  const [orderedProducts, setOrderedProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Need Anything Else? | Amazon.in';

    // Always fetch fallback pool of top-rated products
    const fetchTopProducts = api.get('/products', {
      params: { limit: 20, sort: 'rating' }
    }).then(res => {
      const list = res.data?.data?.products;
      return Array.isArray(list) ? list : [];
    }).catch(() => []);

    // Fetch past orders only if authenticated
    const fetchOrders = isAuthenticated
      ? api.get('/orders').then(({ data }) => {
          const orders = Array.isArray(data.data) ? data.data : [];
          const seen = new Set();
          const products = [];
          orders.forEach(order => {
            (order.items || []).forEach(item => {
              const p = item.product;
              if (p && !seen.has(p.id)) {
                seen.add(p.id);
                products.push(p);
              }
            });
          });
          return products;
        }).catch(() => [])
      : Promise.resolve([]);

    Promise.all([fetchTopProducts, fetchOrders]).then(([top, ordered]) => {
      setTopProducts(top);
      setOrderedProducts(ordered);
      setLoading(false);
    });
  }, [isAuthenticated]);

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  // ── Carousel 1: "Buy it again"
  // Real ordered products → fallback to first 6 top-rated
  const buyAgainProducts = orderedProducts.length > 0
    ? orderedProducts.slice(0, 6)
    : topProducts.slice(0, 6);

  // ── Carousel 2: "Based on your wishlist"
  // Real wishlist items (with product nested) → fallback to next 6 top-rated
  const wishlistProducts = (() => {
    if (wishlist.length > 0) {
      return wishlist
        .filter(item => item.product)
        .map(item => item.product)
        .slice(0, 6);
    }
    return topProducts.slice(6, 12);
  })();

  const carousel1Label = orderedProducts.length > 0 ? 'Buy it again' : 'Top picks for you';
  const carousel2Label = wishlist.length > 0 ? 'Based on your wishlist' : 'More top picks';

  return (
    <div className="nae-page-wrap">
      <div className="nae-page">

        {/* ── Header ────────────────────────────────────── */}
        <div className="nae-header">
          <div className="nae-header-top">
            <h1 className="nae-heading">Need anything else?</h1>
            <div className="nae-actions-right">
              <button className="nae-checkout-btn" onClick={() => navigate('/checkout')}>
                Continue to checkout
              </button>
              <Link to="/cart" className="nae-back-link">Back to Cart</Link>
            </div>
          </div>
          <hr className="nae-divider" />
        </div>

        {/* ── Carousel 1 ────────────────────────────────── */}
        <div className="nae-carousel-section">
          <div className="nae-carousel-header">
            <h2>{carousel1Label}</h2>
            <Link to="/orders" className="nae-view-all">View All &amp; Manage</Link>
          </div>
          <div className="nae-carousel-container">
            <div className="nae-carousel-track">
              {loading
                ? <SkeletonCards count={6} />
                : buyAgainProducts.map(p => (
                  <ProductCard key={p.id} p={p} onAdd={handleAddToCart} />
                ))
              }
            </div>
          </div>
        </div>

        {/* ── Carousel 2 ────────────────────────────────── */}
        {(!loading && wishlistProducts.length > 0) && (
          <div className="nae-carousel-section">
            <div className="nae-carousel-header">
              <h2>{carousel2Label}</h2>
              <Link to="/wishlist" className="nae-view-all">View All &amp; Manage</Link>
            </div>
            <div className="nae-carousel-container">
              <div className="nae-carousel-track">
                {wishlistProducts.map(p => (
                  <ProductCard key={p.id} p={p} onAdd={handleAddToCart} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
