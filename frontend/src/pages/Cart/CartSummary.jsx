import { useNavigate } from 'react-router-dom';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function CartSummary({ cart, loading, items, itemCount, subtotal, shipping, total }) {
  const navigate = useNavigate();

  return (
    <div className="cart-summary">
      {/* Free delivery badge */}
      {shipping === 0 && (
        <div className="cart-summary__free-box">
          <span className="cart-summary__free-check">✓</span> 
          <div>
            Your order qualifies for <strong>FREE Delivery</strong>
            <br/>
            <span style={{color: 'var(--color-text-secondary)', fontSize: 11}}>
              Choose FREE Delivery option at checkout.
            </span>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 400, marginTop: 14 }}>
        Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):
        {' '}<strong>₹{fmt(subtotal)}</strong>
      </h2>

      <div className="cart-summary__gift-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" /> This order contains a gift
        </label>
      </div>

      {/* Proceed to Buy */}
      <button
        id="cart-proceed-to-buy"
        className="cart-proceed-btn"
        disabled={loading || items.length === 0}
        onClick={() => navigate('/need-anything-else')}
        aria-label="Proceed to checkout"
      >
        Proceed to Buy
      </button>

      <div className="cart-summary__cashback">
         Save ₹36 extra using <span style={{color:'#00A8E0', fontWeight: 'bold'}}>⬡</span> 360 <a href="#">Details</a>
      </div>

      <hr className="cart-summary__divider" />

      {/* Shipping / Total */}
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

      <p className="cart-secure">🔒 Secure checkout</p>
    </div>
  );
}
