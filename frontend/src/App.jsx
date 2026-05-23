// App.jsx — Root component: Router + Context Providers + Route definitions
//
// All routes live here. React Router v6 uses <Routes> and <Route>.
// Each route maps a URL path to a page component.
//
// The layout is: Navbar (sticky top) → page content → Footer
// Navbar and Footer are rendered on EVERY page — they live outside <Routes>.
//
// Lazy loading (React.lazy + Suspense) means each page is only downloaded
// when the user navigates to it — faster initial load.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import Navbar  from './components/Navbar/Navbar.jsx';
import Footer  from './components/Footer/Footer.jsx';
import Spinner from './components/Spinner/Spinner.jsx';

// Lazy-loaded pages — each becomes a separate JS chunk
const Home             = lazy(() => import('./pages/Home/Home.jsx'));
const ProductListing   = lazy(() => import('./pages/ProductListing/ProductListing.jsx'));
const ProductDetail    = lazy(() => import('./pages/ProductDetail/ProductDetail.jsx'));
const Cart             = lazy(() => import('./pages/Cart/Cart.jsx'));
const Checkout         = lazy(() => import('./pages/Checkout/Checkout.jsx'));
const OrderConfirmation= lazy(() => import('./pages/OrderConfirmation/OrderConfirmation.jsx'));
const OrderHistory     = lazy(() => import('./pages/OrderHistory/OrderHistory.jsx'));
const Wishlist         = lazy(() => import('./pages/Wishlist/Wishlist.jsx'));
const Login            = lazy(() => import('./pages/Auth/Login.jsx'));
const Signup           = lazy(() => import('./pages/Auth/Signup.jsx'));
const NotFound         = lazy(() => import('./pages/NotFound/NotFound.jsx'));

// A custom ProtectedRoute wrapper to guard sensitive pages
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="spinner-wrap"><div className="spinner" /></div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to login, retaining the original URL in the search query for post-login redirect
    const currentPath = window.location.pathname + window.location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider gives all components access to JWT authentication state */}
      <AuthProvider>
        <WishlistProvider>
          {/* CartProvider wraps everything so Navbar can show item count */}
          <CartProvider>
          {/* Navbar is sticky — always visible while scrolling */}
          <Navbar />

          {/* Suspense shows a spinner while a lazy page chunk is loading */}
          <Suspense fallback={<div className="spinner-wrap"><div className="spinner" /></div>}>
            <main className="page-wrapper">
              <Routes>
                {/* Public pages */}
                <Route path="/"                     element={<Home />} />
                <Route path="/products"             element={<ProductListing />} />
                <Route path="/products/:id"         element={<ProductDetail />} />
                <Route path="/cart"                 element={<Cart />} />
                <Route path="/login"                element={<Login />} />
                <Route path="/signup"               element={<Signup />} />

                {/* Protected pages */}
                <Route path="/checkout"             element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/order-confirmation/:orderId" element={
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                } />
                <Route path="/orders"               element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                } />
                <Route path="/wishlist"             element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                } />

                {/* Catch-all: any unknown URL shows the 404 page */}
                <Route path="*"                     element={<NotFound />} />
              </Routes>
            </main>
          </Suspense>

          <Footer />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
