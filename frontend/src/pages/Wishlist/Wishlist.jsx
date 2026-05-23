// Wishlist.jsx — User's Wish List page
//
// Fetches wishlist items using GET /api/wishlist.
// Handles searching and sorting within the list.
// Integrates with CartContext to move wished items to cart.
// Allows users to delete items from their list.

import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import api from '../../services/api.js';
import './Wishlist.css';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const getPrimaryImage = (images = []) => {
  if (!images?.length) return 'https://via.placeholder.com/120?text=?';
  return (images.find(i => i.is_primary) || images[0]).url;
};

// Simple Star Rating component
function StarRating({ rating }) {
  const stars = [];
  const r = parseFloat(rating) || 0;
  for (let i = 1; i <= 5; i++) {
    if (i <= r) {
      stars.push(<span key={i} style={{ color: 'var(--color-amazon-orange)' }}>★</span>);
    } else if (i - 0.5 <= r) {
      stars.push(<span key={i} style={{ color: 'var(--color-amazon-orange)' }}>⯪</span>);
    } else {
      stars.push(<span key={i} style={{ color: '#ccc' }}>★</span>);
    }
  }
  return <div style={{ fontSize: 14 }}>{stars}</div>;
}

export default function Wishlist() {
  const { addToCart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc', 'price_asc', 'price_desc'
  
  // Track operations to show spinners or disable buttons
  const [actionId, setActionId] = useState(null);

  document.title = 'Your Wish List';

  // Fetch all wishlist items
  const fetchWishlist = () => {
    api.get('/wishlist')
      .then(({ data }) => {
        setWishlistItems(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load wishlist.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Delete item from wishlist
  const handleDeleteItem = async (productId) => {
    setActionId(productId);
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove product from wishlist');
    } finally {
      setActionId(null);
    }
  };

  // Add item to cart and remove from wishlist
  const handleMoveToCart = async (productId) => {
    setActionId(productId);
    try {
      // 1. Add to cart
      const cartRes = await addToCart(productId, 1);
      if (!cartRes.success) {
        throw new Error(cartRes.message);
      }
      // 2. Remove from wishlist
      await api.delete(`/wishlist/${productId}`);
      
      // 3. Update states
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      await fetchCart(); // Refresh cart badge/totals
    } catch (err) {
      alert(err.message || 'Failed to move product to cart.');
    } finally {
      setActionId(null);
    }
  };

  // Process search and sort of wishlist items
  const processedItems = useMemo(() => {
    let result = [...wishlistItems];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.product?.name?.toLowerCase().includes(q) ||
        item.product?.description?.toLowerCase().includes(q)
      );
    }

    // Sort by selection
    if (sortBy === 'price_asc') {
      result.sort((a, b) => parseFloat(a.product?.price || 0) - parseFloat(b.product?.price || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => parseFloat(b.product?.price || 0) - parseFloat(a.product?.price || 0));
    } else {
      // Default: date_desc (newest first)
      result.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
    }

    return result;
  }, [wishlistItems, searchQuery, sortBy]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `Added ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
      <div className="wishlist-page">

        {/* ── Sidebar: List Selector ──────────────────────────── */}
        <aside className="wishlist-sidebar">
          <h2 className="sidebar-title">Your Lists</h2>
          <div className="lists-nav">
            <button className="list-nav-item active">
              <span>Shopping List</span>
              <span className="list-nav-badge">{wishlistItems.length}</span>
            </button>
          </div>
          <button className="create-list-btn" onClick={() => alert('Multiple lists is a premium feature.')}>
            Create a List
          </button>
        </aside>

        {/* ── Main Content: List Details ──────────────────────── */}
        <main className="wishlist-main">
          <div className="list-header">
            <div className="list-info">
              <h1>Shopping List</h1>
              <div className="list-meta">
                <span className="privacy">🔒 Private</span>
                <span>Default List</span>
              </div>
            </div>
            <div className="list-actions">
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {processedItems.length} {processedItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          {/* List Search & Filter Controls */}
          {wishlistItems.length > 0 && (
            <div className="list-controls">
              <div className="search-list-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search this list"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Search list items"
                />
              </div>

              <div className="sort-list-box">
                <label htmlFor="sort-select">Sort by:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="date_desc">Date Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          )}

          {/* Wishlist Items List */}
          {processedItems.length === 0 ? (
            <div className="wishlist-empty">
              <h2>Your Shopping List is empty.</h2>
              <p>
                {wishlistItems.length > 0 
                  ? "No items match your search filter." 
                  : "Add items to your list to track them, get price alerts, or buy them later."}
              </p>
              <Link to="/products" className="btn btn-primary" style={{ padding: '8px 24px', display: 'inline-block' }}>
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="wishlist-items">
              {processedItems.map(item => {
                const product = item.product || {};
                const productId = item.product_id;

                return (
                  <div className="wishlist-item-card" key={item.id} id={`wishlist-item-${productId}`}>
                    {/* Item Thumbnail */}
                    <Link to={`/products/${productId}`} className="item-thumb-link">
                      <img
                        src={getPrimaryImage(product.images)}
                        alt={product.name}
                        loading="lazy"
                      />
                    </Link>

                    {/* Item Details */}
                    <div className="item-details">
                      <Link to={`/products/${productId}`} className="item-title">
                        {product.name}
                      </Link>
                      
                      <div className="item-rating-row">
                        <StarRating rating={product.rating} />
                        <span style={{ fontSize: 12, color: 'var(--color-link)' }}>
                          ({product.review_count})
                        </span>
                      </div>

                      <div className="item-price-row">
                        <span className="item-price">₹{fmt(product.price)}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                          {product.stock_qty > 0 ? 'In Stock' : <span style={{ color: 'var(--color-text-red)', fontWeight: 600 }}>Out of Stock</span>}
                        </span>
                      </div>

                      <span className="item-date-added">{formatDate(item.saved_at)}</span>
                    </div>

                    {/* Item Actions */}
                    <div className="wishlist-item-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleMoveToCart(productId)}
                        disabled={actionId === productId || product.stock_qty <= 0}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        {actionId === productId ? 'Moving…' : 'Move to Cart'}
                      </button>
                      
                      <button
                        className="delete-wish-btn"
                        onClick={() => handleDeleteItem(productId)}
                        disabled={actionId === productId}
                        aria-label={`Remove ${product.name} from list`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
