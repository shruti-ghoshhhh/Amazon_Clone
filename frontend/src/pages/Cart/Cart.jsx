// Cart.jsx — Shopping cart page
//
// Layout: 2-column grid
//   Left (flex-1) : list of cart items — image | title + actions | price
//   Right (300px) : sticky order summary with subtotal, shipping, total
//
// All state lives in CartContext — this component just reads and calls it.
// This is the correct pattern: components = display + user interaction.
// Business logic (API calls, totals) = CartContext.
//
// The qty stepper uses −/+ buttons (not a dropdown) for a cleaner UX.
// Removing an item calls removeFromCart which re-fetches the cart.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import './Cart.css';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const getPrimaryImage = (images = []) => {
  if (!images || images.length === 0) return 'https://via.placeholder.com/130?text=No+Image';
  const primary = images.find(img => img.is_primary);
  return (primary || images[0]).url;
};

// ── Single cart item row ───────────────────────────────────────
function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [updating, setUpdating] = useState(false);

  const product  = item.product || {};
  const imageUrl = getPrimaryImage(product.images);
  const maxQty   = Math.min(product.stock_qty || 10, 10);

  const handleQty = async (delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1 || newQty > maxQty) return;
    setUpdating(true);
    await updateQuantity(item.id, newQty);
    setUpdating(false);
  };

  const handleRemove = async () => {
    setUpdating(true);
    await removeFromCart(item.id);
    // No need to setUpdating(false) — item unmounts after removal
  };

  const lineTotal = parseFloat(product.price) * item.quantity;

  return (
    <div className={`cart-item ${updating ? 'updating' : ''}`}
      style={{ opacity: updating ? 0.6 : 1, transition: 'opacity 0.2s' }}>

      {/* Image */}
      <Link to={`/products/${product.id}`} className="cart-item__img-wrap">
        <img
          src={imageUrl}
          alt={product.name}
          className="cart-item__img"
          loading="lazy"
          onError={e => { e.target.src = 'https://via.placeholder.com/130?text=No+Image'; }}
        />
      </Link>

      {/* Info */}
      <div className="cart-item__info">
        <Link to={`/products/${product.id}`} className="cart-item__title">
          {product.name}
        </Link>

        <div className="cart-item__stock">In Stock</div>
        <div className="cart-item__prime">prime</div>

        {/* Qty stepper + actions */}
        <div className="cart-item__actions">
          {/* − / qty / + stepper */}
          <div className="cart-qty-wrap">
            <button
              className="cart-qty-btn"
              onClick={() => handleQty(-1)}
              disabled={updating || item.quantity <= 1}
              aria-label="Decrease quantity"
            >−</button>

            <span className="cart-qty-num" aria-live="polite">{item.quantity}</span>

            <button
              className="cart-qty-btn"
              onClick={() => handleQty(1)}
              disabled={updating || item.quantity >= maxQty}
              aria-label="Increase quantity"
            >+</button>
          </div>

          <span className="cart-action-sep">|</span>

          <button
            className="cart-action-btn delete"
            onClick={handleRemove}
            disabled={updating}
            aria-label={`Remove ${product.name} from cart`}
            id={`cart-remove-${item.id}`}
          >
            Delete
          </button>

          <span className="cart-action-sep">|</span>

          <button className="cart-action-btn" disabled>Save for later</button>
        </div>
      </div>

      {/* Price */}
      <div className="cart-item__price">
        <div className="cart-item__price-main">₹{fmt(lineTotal)}</div>
        {item.quantity > 1 && (
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            ₹{fmt(product.price)} each
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Cart component ────────────────────────────────────────
export default function Cart() {
  const { cart, loading } = useCart();
  const navigate = useNavigate();

  const items     = cart.items    || [];
  const subtotal  = cart.subtotal || 0;
  const shipping  = cart.shipping_fee || 0;
  const total     = cart.total    || 0;
  const itemCount = cart.item_count || 0;

  // Page title
  document.title = itemCount > 0
    ? `Amazon.in Shopping Cart (${itemCount} item${itemCount > 1 ? 's' : ''})`
    : 'Amazon.in Shopping Cart';

  // ── Empty cart ───────────────────────────────────────────────
  if (!loading && items.length === 0) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
        <div className="cart-page">
          <div className="cart-empty">
            <div className="cart-empty__icon">🛒</div>
            <div className="cart-empty__text">
              <h2>Your Amazon Cart is empty.</h2>
              <p>
                Your shopping cart lives here. Add items and they'll appear here.
              </p>
              <Link to="/products" className="cart-empty__cta" id="cart-continue-shopping">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
      <div className="cart-page">

        {/* ── Left: Cart items ─────────────────────────────── */}
        <div className="cart-main">

          {/* Header */}
          <div className="cart-header">
            <h1>Shopping Cart</h1>
            <div className="cart-subheader">Price</div>
          </div>

          {/* Item rows */}
          <div className="cart-items-wrap">
            {loading ? (
              // Skeleton while loading
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="cart-item">
                  <div className="skeleton" style={{ height: 130 }} />
                  <div>
                    <div className="skeleton skel-line skel-title" />
                    <div className="skeleton skel-line" style={{ width: '40%' }} />
                    <div className="skeleton skel-line" style={{ width: '30%' }} />
                  </div>
                  <div className="skeleton" style={{ width: 80, height: 24 }} />
                </div>
              ))
            ) : (
              items.map(item => (
                <CartItem key={item.id} item={item} />
              ))
            )}

            {/* Total inside items panel */}
            {!loading && items.length > 0 && (
              <div className="cart-total-row">
                Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):
                {' '}<span>₹{fmt(subtotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary ──────────────────────────── */}
        <div className="cart-summary">
          {/* Free delivery badge */}
          {shipping === 0 && (
            <div className="cart-summary__free">
              ✓ Your order qualifies for <strong>FREE Delivery</strong>
            </div>
          )}

          <h2 style={{ fontSize: 18, fontWeight: 400 }}>
            Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):
            {' '}<strong>₹{fmt(subtotal)}</strong>
          </h2>

          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" /> This is a gift
            </label>
          </div>

          <hr className="cart-summary__divider" />

          {/* Shipping */}
          <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Delivery:</span>
            <span style={{ color: shipping === 0 ? 'var(--color-text-green)' : 'inherit', fontWeight: 600 }}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </span>
          </div>

          <div style={{ fontSize: 13, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span>Total:</span>
            <strong style={{ fontSize: 20 }}>₹{fmt(total)}</strong>
          </div>

          <hr className="cart-summary__divider" />

          {/* Proceed to Buy */}
          <button
            id="cart-proceed-to-buy"
            className="cart-proceed-btn"
            disabled={loading || items.length === 0}
            onClick={() => navigate('/checkout')}
            aria-label="Proceed to checkout"
          >
            Proceed to Buy
          </button>

          <p className="cart-secure">🔒 Secure checkout</p>
        </div>

      </div>{/* /cart-page */}
    </div>
  );
}
