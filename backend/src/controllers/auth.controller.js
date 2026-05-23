// auth.controller.js — Handlers for authentication routes
//
// This controller manages all user access and registration routes.
// It handles:
//   1. signup — registers a new user, hashes password, saves to DB, returns user + JWT
//   2. login  — validates credentials, generates JWT access token
//   3. getMe  — fetches details of currently logged-in user using verified JWT session

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';

// Helper to sign JWT tokens
const signToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'amazon_clone_super_secret_jwt_key_2024', 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── POST /api/auth/signup ──────────────────────────────────────────────────
// Registers a new user.
// Request Body: { name, email, password }
export const signup = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // 1. Basic validation
  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email, and password.', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long.', 400));
  }

  // 2. Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email address is already in use.', 400));
  }

  // 3. Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 4. Create user in database
  const newUser = await User.create({
    name,
    email,
    password_hash: passwordHash,
  });

  // 5. Generate JWT token
  const token = signToken(newUser.id);

  // 6. Return response (excluding password hash)
  res.status(201).json({
    success: true,
    token,
    data: {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      }
    }
  });
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────
// Authenticates user and returns JWT access token.
// Request Body: { email, password }
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  // 2. Find user in database
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 4. Generate JWT token
  const token = signToken(user.id);

  // 5. Return response
  res.status(200).json({
    success: true,
    token,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    }
  });
});

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
// Retrieves current user profile. Secured by auth middleware.
export const getMe = catchAsync(async (req, res, next) => {
  // The user object is already attached to req.user by auth middleware
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});
