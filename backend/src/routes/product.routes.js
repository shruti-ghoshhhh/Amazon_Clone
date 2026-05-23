// product.routes.js — Maps HTTP methods + URL paths to controller functions
//
// Express Router creates a mini-app that handles a subset of routes.
// We mount this router at /api/products in app.js, so:
//   router.get('/')     → handles GET /api/products
//   router.get('/:id')  → handles GET /api/products/:id
//
// The router's only job is routing — zero business logic here.
// All logic lives in the controller.

import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/product.controller.js';

const router = Router();

// GET /api/products?search=&category=&sort=&page=&limit=
router.get('/', getProducts);

// GET /api/products/:id
router.get('/:id', getProductById);

export default router;
