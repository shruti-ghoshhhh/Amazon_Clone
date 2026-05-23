// OrderHistory.jsx — User's order history page
//
// Fetches the user's orders using GET /api/orders.
// Each order card is fully interactive:
//   - Shows Amazon-style order header (Placed Date, Total, Ship To, Order ID).
//   - Color-coded order status (pending, confirmed, shipped, delivered).
//   - Displays items with thumbnail, product name linking to detail page, quantity, and snapshot unit price.
//   - "Buy it again" button re-adds the product to cart using CartContext and redirects to /cart.
//   - Extra interactive options like writing a product review (link placeholder).

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import api from '../../services/api.js';
import './OrderHistory.css';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const getPrimaryImage = (images = []) => {
  if (!images?.length) return 'https://via.placeholder.com/70?text=?';
  return (images.find(i => i.is_primary) || images[0]).url;
};

export default function OrderHistory() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'buy_again', 'not_shipped', 'cancelled'
  const [addingId, setAddingId] = useState(null); // tracking which product is being bought again

  document.title = 'Your Orders';

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => {
        setOrders(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to fetch order history.');
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleBuyAgain = async (productId) => {
    setAddingId(productId);
    const res = await addToCart(productId, 1);
    setAddingId(null);
    if (res.success) {
      navigate('/cart');
    } else {
      alert(res.message || 'Failed to add item back to cart');
    }
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'not_shipped') {
      return orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
    }
    if (activeTab === 'cancelled') {
      return []; // In this simplified clone, orders cannot be cancelled yet
    }
    return orders;
  };

  if (loading) {
    return (
      <div className="orders-page">
        <h1 className="orders-title">Your Orders</h1>
        <div className="orders-tabs">
          <button className="orders-tab active">Orders</button>
          <button className="orders-tab">Buy Again</button>
          <button className="orders-tab">Not Yet Shipped</button>
          <button className="orders-tab">Cancelled Orders</button>
        </div>
        <div className="orders-list">
          <div className="order-skeleton" />
          <div className="order-skeleton" />
          <div className="order-skeleton" />
        </div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
      <div className="orders-page">
        <h1 className="orders-title">Your Orders</h1>

        {/* Navigation Tabs */}
        <div className="orders-tabs" role="tablist">
          <button
            className={`orders-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            role="tab"
            aria-selected={activeTab === 'orders'}
          >
            Orders
          </button>
          <button
            className={`orders-tab ${activeTab === 'buy_again' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy_again')}
            role="tab"
            aria-selected={activeTab === 'buy_again'}
          >
            Buy Again
          </button>
          <button
            className={`orders-tab ${activeTab === 'not_shipped' ? 'active' : ''}`}
            onClick={() => setActiveTab('not_shipped')}
            role="tab"
            aria-selected={activeTab === 'not_shipped'}
          >
            Not Yet Shipped
          </button>
          <button
            className={`orders-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
            role="tab"
            aria-selected={activeTab === 'cancelled'}
          >
            Cancelled Orders
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">{error}</div>
        )}

        {/* Orders Content */}
        {filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <h3>No orders found</h3>
            <p>
              {activeTab === 'orders' 
                ? "You haven't placed any orders in the past." 
                : activeTab === 'not_shipped' 
                ? "You have no pending or unshipped orders." 
                : "You don't have any items here."}
            </p>
            <Link to="/products" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map(order => {
              const items = order.items || [];
              const address = order.address || {};
              const orderStatus = order.status || 'pending';

              return (
                <div className="order-card" key={order.id} id={`order-card-${order.id}`}>
                  {/* Order Header Box */}
                  <div className="order-card__header">
                    <div className="header-left">
                      <div className="header-meta">
                        <span className="meta-title">Order Placed</span>
                        <span className="meta-value">{formatDate(order.placed_at)}</span>
                      </div>
                      <div className="header-meta">
                        <span className="meta-title">Total</span>
                        <span className="meta-value">₹{fmt(order.total)}</span>
                      </div>
                      <div className="header-meta">
                        <span className="meta-title">Ship To</span>
                        <span className="meta-value" title={`${address.full_name}, ${address.line1}, ${address.city}`}>
                          {address.full_name || 'Recipient'} ▾
                        </span>
                      </div>
                    </div>

                    <div className="header-right">
                      <span className="meta-title">Order # {order.id.slice(0, 8)}...</span>
                      <Link to={`/order-confirmation/${order.id}`} className="order-id-link">
                        View order details
                      </Link>
                    </div>
                  </div>

                  {/* Order Card Body */}
                  <div className="order-card__body">
                    {/* Status Message */}
                    <div className={`order-status ${orderStatus}`}>
                      {orderStatus === 'delivered' && 'Delivered'}
                      {orderStatus === 'shipped' && 'Shipped'}
                      {orderStatus === 'confirmed' && 'Preparing for dispatch'}
                      {orderStatus === 'pending' && 'Pending payment confirmation'}
                    </div>

                    {/* Order items listing */}
                    <div className="order-items-container">
                      {items.map(item => (
                        <div className="order-item-row" key={item.id}>
                          <img
                            className="item-thumb"
                            src={getPrimaryImage(item.product?.images)}
                            alt={item.product?.name}
                          />

                          <div className="item-info">
                            <Link to={`/products/${item.product?.id}`} className="item-name">
                              {item.product?.name}
                            </Link>
                            <span className="item-qty">Quantity: {item.quantity}</span>
                            <span className="item-price">₹{fmt(item.unit_price)} each</span>
                          </div>

                          <div className="item-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleBuyAgain(item.product?.id)}
                              disabled={addingId === item.product?.id}
                              aria-label={`Buy ${item.product?.name} again`}
                            >
                              {addingId === item.product?.id ? 'Adding to cart…' : 'Buy it again'}
                            </button>
                            <Link
                              to={`/products/${item.product?.id}`}
                              className="btn btn-secondary"
                            >
                              Write a product review
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
