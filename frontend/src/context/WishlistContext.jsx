// WishlistContext.jsx — Global wishlist state shared across the entire app
//
// WHY CONTEXT?
// The Love icon (heart badge) appears on every ProductCard across the homepage,
// product details, and category listings. If the user clicks the heart, it must
// update the backend database (/api/wishlist) and instantly reflect across all
// rendered ProductCards in real-time. This context provides global synchronization
// and caching of the user's active wishlist items.
//
// Pattern:
//   1. Tracks the user's active wishlist array
//   2. Listens to user auth states (refetches on login, purges on logout)
//   3. Provides atomic toggleWishlist(productId) and isInWishlist(productId) checks

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch the user's wishlist from the database
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data.data || []);
    } catch (err) {
      console.error('❌ [Wishlist Context] Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load wishlist when authentication state changes
  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  // Check if a specific product is currently wishlisted
  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => String(item.product_id) === String(productId));
  }, [wishlist]);

  // Add an item to the wishlist
  const addToWishlist = async (productId) => {
    if (!isAuthenticated) return { success: false, requireAuth: true };
    try {
      const { data } = await api.post('/wishlist', { product_id: productId });
      // To ensure local UI state has the product info nested like the backend response:
      if (data?.success) {
        await fetchWishlist(); // Refetch to keep item model and dates perfectly synchronized
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error('❌ [Wishlist Context] Error adding to wishlist:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to add to wishlist' };
    }
  };

  // Remove an item from the wishlist
  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) return { success: false, requireAuth: true };
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      if (data?.success) {
        setWishlist(prev => prev.filter(item => String(item.product_id) !== String(productId)));
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error('❌ [Wishlist Context] Error removing from wishlist:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to remove from wishlist' };
    }
  };

  // Toggle wishlist state
  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      return { success: false, requireAuth: true };
    }
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, fetchWishlist, isInWishlist, toggleWishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

// Custom hook to consume the global Wishlist Context
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a <WishlistProvider>');
  return ctx;
}
