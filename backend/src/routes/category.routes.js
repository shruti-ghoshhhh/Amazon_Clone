// category.routes.js — Routes for category endpoints

import { Router } from 'express';
import { getCategories, getCategoryBySlug } from '../controllers/category.controller.js';

const router = Router();

// GET /api/categories — all parent categories with subcategories
router.get('/', getCategories);

// GET /api/categories/:slug — single category by slug
router.get('/:slug', getCategoryBySlug);

export default router;
