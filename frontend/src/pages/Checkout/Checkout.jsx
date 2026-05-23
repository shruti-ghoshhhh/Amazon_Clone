// Checkout.jsx — Checkout page
//
// Two sections on the left:
//   1. Delivery address — shows existing addresses, lets user add new one
//   2. Items in cart — read-only order preview
//
// Right panel: order summary with "Place your order" button
//
// On submit:
//   1. POST /api/orders with { address_id }
//   2. Cart is cleared by the backend (inside the transaction)
//   3. CartContext re-fetches → navbar badge goes to 0
//   4. Navigate to /order-confirmation/:orderId

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import api from '../../services/api.js';
import './Checkout.css';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const getPrimaryImage = (images = []) => {
  if (!images?.length) return 'https://via.placeholder.com/70?text=?';
  return (images.find(i => i.is_primary) || images[0]).url;
};

export default function Checkout() {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [addresses,      setAddresses]      = useState([]);
  const [selectedAddr,   setSelectedAddr]   = useState('');
  const [showAddrForm,   setShowAddrForm]   = useState(false);
  const [placing,        setPlacing]        = useState(false);
  const [error,          setError]          = useState('');

  // New address form fields
  const [newAddr, setNewAddr] = useState({
    full_name: 'Test User', line1: '', line2: '',
    city: '', state: '', pincode: '', is_default: false
  });

  document.title = 'Amazon.in — Checkout';

  // Redirect to cart if empty
  useEffect(() => {
    if (!cart.items?.length && !cart.item_count) {
      // small delay to let cart load first
    }
  }, [cart]);

  // Fetch saved addresses
  useEffect(() => {
    api.get('/addresses')
      .then(({ data }) => {
        setAddresses(data.data || []);
        const defaultAddr = data.data?.find(a => a.is_default);
        if (defaultAddr) setSelectedAddr(defaultAddr.id);
        else if (data.data?.length) setSelectedAddr(data.data[0].id);
      })
      .catch(() => {});
  }, []);

  // Add new address then select it
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
      setError('Please fill in all required address fields.');
      return;
    }
    try {
      const { data } = await api.post('/addresses', newAddr);
      setAddresses(prev => [...prev, data.data]);
      setSelectedAddr(data.data.id);
      setShowAddrForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address.');
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!selectedAddr) { setError('Please select a delivery address.'); return; }
    if (!cart.items?.length) { setError('Your cart is empty.'); return; }

    setPlacing(true);
    setError('');
    try {
      const { data } = await api.post('/orders', { address_id: selectedAddr });
      await fetchCart(); // Refresh cart — backend cleared it, badge goes to 0
      navigate(`/order-confirmation/${data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  const items    = cart.items    || [];
  const subtotal = cart.subtotal || 0;
  const shipping = cart.shipping_fee || 0;
  const total    = cart.total    || 0;
  const itemCount= cart.item_count || 0;

  // If cart is empty, redirect
  if (!cart.item_count && !cart.items?.length) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh', padding: 40, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>Your cart is empty</h2>
        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
      <div className="checkout-page">

        {/* ── Left ──────────────────────────────────────────── */}
        <div>
          <h1 className="checkout-title">Checkout</h1>

          {/* Error message */}
          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          {/* Section 1: Delivery Address */}
          <div className="checkout-section">
            <div className="checkout-section__header">
              <h2>1 — Delivery Address</h2>
            </div>
            <div className="checkout-section__body">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className={`address-card ${selectedAddr === addr.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAddr(addr.id)}
                  role="radio"
                  aria-checked={selectedAddr === addr.id}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedAddr(addr.id)}
                  id={`address-card-${addr.id}`}
                >
                  <input
                    type="radio"
                    className="address-card__radio"
                    checked={selectedAddr === addr.id}
                    onChange={() => setSelectedAddr(addr.id)}
                    aria-label={`Select address for ${addr.full_name}`}
                  />
                  <div className="address-card__name">{addr.full_name}</div>
                  <div className="address-card__line">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                    {addr.city}, {addr.state} — {addr.pincode}
                  </div>
                  {addr.is_default && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-green)', fontWeight: 600 }}>
                      Default address
                    </span>
                  )}
                </div>
              ))}

              {/* Toggle add-new-address form */}
              <button
                className="toggle-address-btn"
                onClick={() => setShowAddrForm(o => !o)}
                id="toggle-new-address"
              >
                + Add a new delivery address
              </button>

              {showAddrForm && (
                <form className="add-address-form" onSubmit={handleAddAddress}>
                  <h3>Add a new address</h3>
                  <div className="form-group full">
                    <label>Full Name *</label>
                    <input value={newAddr.full_name} onChange={e => setNewAddr(p => ({...p, full_name: e.target.value}))} placeholder="Full name" />
                  </div>
                  <div className="form-group full">
                    <label>Address Line 1 *</label>
                    <input value={newAddr.line1} onChange={e => setNewAddr(p => ({...p, line1: e.target.value}))} placeholder="House number, street name" required />
                  </div>
                  <div className="form-group full">
                    <label>Address Line 2</label>
                    <input value={newAddr.line2} onChange={e => setNewAddr(p => ({...p, line2: e.target.value}))} placeholder="Apartment, area (optional)" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input value={newAddr.city} onChange={e => setNewAddr(p => ({...p, city: e.target.value}))} placeholder="City" required />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input value={newAddr.state} onChange={e => setNewAddr(p => ({...p, state: e.target.value}))} placeholder="State" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input value={newAddr.pincode} onChange={e => setNewAddr(p => ({...p, pincode: e.target.value}))} placeholder="6-digit pincode" maxLength={6} required />
                  </div>
                  <button type="submit" className="btn btn-primary" id="save-address-btn">
                    Save this address
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Section 2: Items */}
          <div className="checkout-section">
            <div className="checkout-section__header">
              <h2>2 — Review Items</h2>
            </div>
            <div className="checkout-section__body">
              {items.map(item => (
                <div className="checkout-item" key={item.id}>
                  <img
                    src={getPrimaryImage(item.product?.images)}
                    alt={item.product?.name}
                    loading="lazy"
                  />
                  <div className="checkout-item__info">
                    <p className="checkout-item__name">{item.product?.name}</p>
                    <p className="checkout-item__qty">Qty: {item.quantity}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-green)', fontWeight: 600 }}>In Stock</p>
                  </div>
                  <div className="checkout-item__price">
                    ₹{fmt(parseFloat(item.product?.price) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Summary ────────────────────────────────── */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Items ({itemCount}):</span>
            <span>₹{fmt(subtotal)}</span>
          </div>
          <div className={`summary-row ${shipping === 0 ? 'free' : ''}`}>
            <span>Delivery:</span>
            <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
          </div>
          <div className="summary-row total">
            <span>Order Total:</span>
            <span>₹{fmt(total)}</span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            By placing your order, you agree to Amazon's{' '}
            <a href="#">privacy notice</a> and{' '}
            <a href="#">conditions of use</a>.
          </p>

          <button
            id="place-order-btn"
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={placing || !selectedAddr}
            aria-label="Place your order"
          >
            {placing ? 'Placing order…' : 'Place your order'}
          </button>

          <p className="checkout-secure">🔒 Secure checkout — SSL encrypted</p>
        </div>

      </div>

    </div>
  );
}
