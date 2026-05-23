// OrderConfirmation.jsx — Post-purchase success screen
//
// Reads orderId from URL via useParams().
// Fetches detailed order details from backend GET /api/orders/:id.
// Displays order number, estimated delivery, delivery address, order items preview, and pricing details.
//
// Key details matching Amazon:
//   - Success banner with checkmark (in green)
//   - Estimated delivery calculation
//   - Detailed summary showing price paid
//   - "Continue Shopping" and "View Your Orders" actions

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import './OrderConfirmation.css';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const getPrimaryImage = (images = []) => {
  if (!images?.length) return 'https://via.placeholder.com/70?text=?';
  return (images.find(i => i.is_primary) || images[0]).url;
};

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  document.title = 'Amazon.in — Order Confirmed';

  useEffect(() => {
    if (!orderId) return;

    api.get(`/orders/${orderId}`)
      .then(({ data }) => {
        setOrder(data.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load order confirmation details.');
        setLoading(false);
      });
  }, [orderId]);

  // Calculate estimated delivery date (placed_at + 3 days)
  const getDeliveryDateString = (placedAtString) => {
    const placedDate = placedAtString ? new Date(placedAtString) : new Date();
    const deliveryDate = new Date(placedDate);
    deliveryDate.setDate(placedDate.getDate() + 3);

    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return deliveryDate.toLocaleDateString('en-IN', options);
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh', padding: '40px 16px', textAlign: 'center' }}>
        <div className="alert alert-error" style={{ maxWidth: 600, margin: '0 auto 20px auto' }}>
          {error || 'Order not found.'}
        </div>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  const items = order.items || [];
  const address = order.address || {};
  const deliveryDateStr = getDeliveryDateString(order.placed_at);

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
      <div className="confirmation-page">
        
        {/* Success Header Card */}
        <div className="success-card">
          <div className="success-header">
            <div className="success-icon-wrap">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1>Order placed, thank you!</h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Confirmation has been sent to your email.
              </p>
            </div>
          </div>

          <div className="order-metadata">
            <div className="meta-item">
              <span className="meta-label">Order Number</span>
              <span className="meta-value order-id">{order.id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Delivery Address</span>
              <span className="meta-value">
                {address.full_name}, {address.city}, {address.state}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Payment Mode</span>
              <span className="meta-value">Pay on Delivery (POD)</span>
            </div>
          </div>

          <div className="delivery-notice">
            <p>
              Estimated delivery: <strong>{deliveryDateStr}</strong><br />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Your order is being processed and will be delivered by our shipping partner.
              </span>
            </p>
          </div>
        </div>

        {/* Order Summary & Items Card */}
        <div className="summary-card">
          <h2>Order Summary</h2>
          
          <div className="items-preview">
            {items.map(item => (
              <div className="preview-row" key={item.id}>
                <div className="preview-row__left">
                  <img
                    className="preview-thumb"
                    src={getPrimaryImage(item.product?.images)}
                    alt={item.product?.name}
                  />
                  <div>
                    <div className="preview-title" title={item.product?.name}>
                      {item.product?.name}
                    </div>
                    <span className="preview-qty">Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className="preview-row__right">
                  ₹{fmt(parseFloat(item.unit_price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="financials-list">
            <div className="financial-row">
              <span>Subtotal</span>
              <span>₹{fmt(order.subtotal)}</span>
            </div>
            <div className="financial-row">
              <span>Shipping & Handling</span>
              <span>{parseFloat(order.shipping_fee) === 0 ? 'FREE' : `₹${fmt(order.shipping_fee)}`}</span>
            </div>
            <div className="financial-row total">
              <span>Order Total</span>
              <span>₹{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="confirmation-actions">
          <Link to="/products" className="btn btn-secondary">
            Continue Shopping
          </Link>
          <Link to="/orders" className="btn btn-primary" id="view-orders-btn">
            View Your Orders
          </Link>
        </div>

      </div>
    </div>
  );
}
