import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  placeOrder,
  getOrders,
  getOrderById,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/order.controller.js';

const router = Router();
router.use(auth);

router.post('/',         placeOrder);            // POST   /api/orders
router.post('/razorpay', createRazorpayOrder);  // POST   /api/orders/razorpay
router.post('/verify',   verifyRazorpayPayment); // POST   /api/orders/verify
router.get('/',          getOrders);             // GET    /api/orders
router.get('/:id',       getOrderById);          // GET    /api/orders/:id

export default router;
