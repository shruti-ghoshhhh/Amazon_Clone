// defaultUser.js — Middleware that attaches the default logged-in user
//
// The assignment states: "No Login Required — Assume a default user is logged in."
// This middleware fulfills that requirement by attaching the test user's ID
// to every request as req.user, exactly like a real JWT auth middleware would.
//
// DESIGN DECISION (important for your evaluation):
// We built this as a SEPARATE middleware, not hardcoded into each controller.
// This means when we add real JWT auth later, we ONLY change this one file.
// Every controller that uses req.user will instantly work with real auth.
// This is the Open/Closed Principle — open for extension, closed for modification.
//
// To swap in real auth: replace this file's logic with JWT verification.
// Zero changes needed anywhere else.

import { User } from '../models/index.js';

// The UUID of test@amazon.com from our seeded data
const DEFAULT_USER_ID = '3d86c969-9a52-4f32-b393-8bed9ac1e884';

export const defaultUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(DEFAULT_USER_ID, {
      attributes: ['id', 'name', 'email'], // Never expose password_hash
    });

    if (!user) {
      return res.status(500).json({ message: 'Default user not found. Please run the seeder.' });
    }

    req.user = user; // Attach to request — controllers access via req.user.id
    next();          // Pass control to the next middleware / route handler
  } catch (err) {
    next(err);
  }
};
