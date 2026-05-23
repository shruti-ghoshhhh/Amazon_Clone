// CartContext.jsx — Global cart state shared across the entire app
//
// WHY CONTEXT?
// The cart item count appears in the Navbar. Cart data is needed in Cart page,
// Product Detail page, and Checkout. Instead of prop-drilling (passing data
// through every parent → child → grandchild), we put it in Context so any
// component can access it directly.
//
// Pattern used:
//   1. Create a Context object
//   2. Create a Provider component that holds the state + API calls
//   3. Export a custom hook (useCart) for easy consumption
//   4. Wrap the app in <CartProvider> in App.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';

// The context object — holds the shape of data any consumer can access
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart]       = useState({ items: [], subtotal: 0, shipping_fee: 0, total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], subtotal: 0, shipping_fee: 0, total: 0, item_count: 0 });
      return;
    }
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, [isAuthenticated]);

  // Load/reload cart when authentication state changes
  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Add item — calls API, then refreshes cart state
  const addToCart = async (product_id, quantity = 1) => {
    setLoading(true);
    try {
      await api.post('/cart', { product_id, quantity });
      await fetchCart(); // Refresh to get accurate totals
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add to cart' };
    } finally {
      setLoading(false);
    }
  };

  // Update quantity of a specific cart item
  const updateQuantity = async (itemId, quantity) => {
    try {
      await api.put(`/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  // Remove a specific item from cart
  const removeFromCart = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Clear entire cart (called after order is placed)
  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ items: [], subtotal: 0, shipping_fee: 0, total: 0, item_count: 0 });
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook — components call useCart() instead of useContext(CartContext)
// This is cleaner and throws a helpful error if used outside the provider
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
