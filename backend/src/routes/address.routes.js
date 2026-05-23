import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getAddresses, createAddress, deleteAddress } from '../controllers/address.controller.js';

const router = Router();
router.use(auth);

router.get('/',     getAddresses);   // GET    /api/addresses
router.post('/',    createAddress);  // POST   /api/addresses
router.delete('/:id', deleteAddress);// DELETE /api/addresses/:id

export default router;
