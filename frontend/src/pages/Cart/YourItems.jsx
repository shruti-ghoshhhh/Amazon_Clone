// YourItems.jsx — "Your Items" section below the main cart.
//
// Tab 1: Saved for later → real items from the user's WishlistContext.
// Tab 2: Buy it again   → unique products extracted from past order history.
//
// Modularity: item rendering is fully delegated to SavedItemCard and BuyAgainItemCard.

import { useState, useEffect } from 'react';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import SavedItemCard from './SavedItemCard.jsx';
import BuyAgainItemCard from './BuyAgainItemCard.jsx';

export default function YourItems() {
  const { wishlist, fetchWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('saved');

  // Past-order products (de-duped, extracted from /api/orders)
  const [pastProducts, setPastProducts] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch order history once when the user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setOrdersLoading(true);
    api.get('/orders')
      .then(({ data }) => {
        const orders = data.data || [];
        // Flatten order items → extract product objects → de-duplicate by product id
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
        setPastProducts(products);
      })
      .catch(err => console.error('❌ [YourItems] Failed to fetch orders:', err))
      .finally(() => setOrdersLoading(false));
  }, [isAuthenticated]);

  // Called by SavedItemCard after a move/delete so parent re-reads wishlist
  const handleWishlistChange = () => fetchWishlist();

  // ── Skeleton ─────────────────────────────────────────────
  const SkeletonCards = ({ count = 4 }) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="saved-card skeleton-card">
          <div className="skeleton" style={{ width: 100, height: 100, borderRadius: 6 }} />
          <div className="saved-card__body" style={{ gap: 8 }}>
            <div className="skeleton skel-line" style={{ width: '90%' }} />
            <div className="skeleton skel-line" style={{ width: '60%' }} />
            <div className="skeleton skel-line" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </>
  );

  // ── Empty states ─────────────────────────────────────────
  const SavedEmpty = () => (
    <div className="your-items__empty">
      <span className="your-items__empty-icon">🤍</span>
      <p>No saved items yet. Heart a product to save it for later!</p>
    </div>
  );

  const BuyAgainEmpty = () => (
    <div className="your-items__empty">
      <span className="your-items__empty-icon">🛍️</span>
      <p>No past purchases found. Complete an order to see items here!</p>
    </div>
  );

  return (
    <div className="cart-your-items">
      <h2 className="cart-your-items__title">Your Items</h2>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="cart-your-items__tabs">
        <button
          className={`cart-your-items__tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved for later
          {wishlist.length > 0 && (
            <span className="cart-your-items__badge">{wishlist.length}</span>
          )}
        </button>
        <button
          className={`cart-your-items__tab ${activeTab === 'buy-again' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy-again')}
        >
          Buy it again
          {pastProducts.length > 0 && (
            <span className="cart-your-items__badge">{pastProducts.length}</span>
          )}
        </button>
      </div>

      {/* ── Tab Content ───────────────────────────────────── */}
      <div className="cart-your-items__content">

        {activeTab === 'saved' && (
          wishlist.length === 0
            ? <SavedEmpty />
            : (
              <div className="cart-your-items__grid">
                {wishlist.map(item => (
                  <SavedItemCard
                    key={item.id ?? item.product_id}
                    item={item}
                    onMoved={handleWishlistChange}
                  />
                ))}
              </div>
            )
        )}

        {activeTab === 'buy-again' && (
          ordersLoading
            ? <div className="cart-your-items__grid"><SkeletonCards /></div>
            : pastProducts.length === 0
              ? <BuyAgainEmpty />
              : (
                <div className="cart-your-items__grid">
                  {pastProducts.map(product => (
                    <BuyAgainItemCard key={product.id} item={product} />
                  ))}
                </div>
              )
        )}

      </div>
    </div>
  );
}
