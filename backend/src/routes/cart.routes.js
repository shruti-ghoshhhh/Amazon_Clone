// cart.routes.js — Cart endpoints, all protected by JWT auth middleware
//
// auth runs BEFORE every cart handler, attaching req.user.

import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller.js';

const router = Router();

// Apply auth to ALL routes in this router
router.use(auth);

router.get('/',          getCart);         // GET    /api/cart
router.post('/',         addToCart);       // POST   /api/cart
router.put('/:itemId',   updateCartItem);  // PUT    /api/cart/:itemId
router.delete('/:itemId', removeFromCart); // DELETE /api/cart/:itemId
router.delete('/',       clearCart);       // DELETE /api/cart  (clear all)

export default router;
