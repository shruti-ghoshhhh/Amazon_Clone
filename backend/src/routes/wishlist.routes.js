import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js';

const router = Router();
router.use(auth);

router.get('/',    getWishlist);
router.post('/',   addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
