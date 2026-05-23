import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { placeOrder, getOrders, getOrderById } from '../controllers/order.controller.js';

const router = Router();
router.use(auth);

router.post('/',    placeOrder);    // POST   /api/orders
router.get('/',     getOrders);     // GET    /api/orders
router.get('/:id',  getOrderById);  // GET    /api/orders/:id

export default router;
