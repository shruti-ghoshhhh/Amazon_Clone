import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import CartItem from './CartItem.jsx';
import CartSummary from './CartSummary.jsx';
import YourItems from './YourItems.jsx';
import './Cart.css';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Cart() {
  const { cart, loading } = useCart();

  const items     = cart.items    || [];
  const subtotal  = cart.subtotal || 0;
  const shipping  = cart.shipping_fee || 0;
  const total     = cart.total    || 0;
  const itemCount = cart.item_count || 0;

  document.title = itemCount > 0
    ? `Amazon.in Shopping Cart (${itemCount} item${itemCount > 1 ? 's' : ''})`
    : 'Amazon.in Shopping Cart';

  if (!loading && items.length === 0) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
        <div className="cart-page">
          <div className="cart-empty">
            <div className="cart-empty__icon">🛒</div>
            <div className="cart-empty__text">
              <h2>Your Amazon Cart is empty.</h2>
              <p>Your shopping cart lives here. Add items and they'll appear here.</p>
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

        <div className="cart-main-col">
          {/* ── Left: Cart items ─────────────────────────────── */}
          <div className="cart-main">
            <div className="cart-header">
              <h1>Shopping Cart</h1>
              <div className="cart-header-actions">
                <button className="cart-deselect-btn">Deselect all items</button>
                <div className="cart-subheader">Price</div>
              </div>
            </div>

            <div className="cart-items-wrap">
              {loading ? (
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

              {!loading && items.length > 0 && (
                <div className="cart-total-row">
                  Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):
                  {' '}<span>₹{fmt(subtotal)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Your Items Section */}
          <YourItems />
        </div>

        {/* ── Right: Order Summary ──────────────────────────── */}
        <CartSummary 
          cart={cart} 
          loading={loading} 
          items={items} 
          itemCount={itemCount} 
          subtotal={subtotal} 
          shipping={shipping} 
          total={total} 
        />
        
      </div>
    </div>
  );
}
