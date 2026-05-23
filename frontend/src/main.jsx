// main.jsx — React application entry point
//
// This is the file Vite loads first. It:
//   1. Imports the global CSS (design system tokens, resets, utilities)
//   2. Mounts the root React component into <div id="root"> in index.html
//
// StrictMode: React renders components twice in development to catch bugs.
// It has zero effect in production builds.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
