// auth.js — JWT Verification Middleware
//
// This middleware secures API endpoints by enforcing authentication.
// It intercepts incoming requests, extracts the JWT bearer token from
// the Authorization header, verifies its signature, and fetches the
// associated User from the database.
//
// If the token is valid, it attaches the user object to req.user so that
// downstream route handlers can access the logged-in user's details.
// If the token is missing, expired, or invalid, it returns a 401 Unauthorized response.

import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const auth = async (req, res, next) => {
  try {
    // 1. Get the Authorization header from the request
    const authHeader = req.header('Authorization');
    
    // Check if the header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No authentication token provided.' 
      });
    }

    // 2. Extract the token from the header string
    const token = authHeader.replace('Bearer ', '');

    // 3. Verify the token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'amazon_clone_super_secret_jwt_key_2024');

    // 4. Fetch the user from the database (ensuring the user still exists)
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email'], // Securely retrieve only non-sensitive columns
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'The user session is invalid. User no longer exists.' 
      });
    }

    // 5. Attach the user object to the request
    req.user = user;
    next(); // Proceed to the next middleware or controller handler
  } catch (error) {
    // Handle invalid or expired token errors
    console.error('❌ [Auth Middleware] JWT verification failed:', error.message);
    
    let message = 'Invalid authentication token.';
    if (error.name === 'TokenExpiredError') {
      message = 'Authentication token has expired. Please log in again.';
    }

    return res.status(401).json({ message });
  }
};
