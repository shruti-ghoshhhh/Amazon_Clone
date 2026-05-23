// api.js — Axios instance (centralized API client)
//
// WHY A CUSTOM AXIOS INSTANCE?
// Instead of writing the full URL in every component:
//   axios.get('http://localhost:5000/api/products')
// We configure it once here and just write:
//   api.get('/products')
//
// It also automatically:
//   - Attaches the JWT token to every request (if user is logged in)
//   - Handles 401 Unauthorized globally (e.g. token expired → redirect to login)

import axios from 'axios';

// VITE_ prefix is required for Vite to expose env variables to the browser
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────────
// Runs before EVERY outgoing request.
// Reads the JWT from localStorage and attaches it as a Bearer token.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────────
// Runs after EVERY incoming response.
// If any request returns 401 (Unauthorized), clear auth and redirect to login if not already there.
api.interceptors.response.use(
  (response) => response, // Pass through successful responses untouched
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
