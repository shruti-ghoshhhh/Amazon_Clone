// auth.routes.js — Authentication routes for registration and login
//
// Mount points:
//   - POST /api/auth/signup - Register new account (public)
//   - POST /api/auth/login  - Authenticate and get JWT token (public)
//   - GET  /api/auth/me     - Retrieve current active user profile (protected)

import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (valid JWT token required)
router.get('/me', auth, getMe);

export default router;
