// category.controller.js — Handler for category routes
//
// Categories are used in two ways:
//   1. The navbar dropdown — list all parent categories + their subcategories
//   2. The product filter sidebar — clicking a category filters products by slug

import { Category } from '../models/index.js';
import { catchAsync } from '../middleware/errorHandler.js';

// ─── GET /api/categories ──────────────────────────────────────────────────────
// Returns all parent categories with their subcategories nested inside.
// Response shape:
// [
//   { id, name, slug, subcategories: [{ id, name, slug }, ...] },
//   ...
// ]
export const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.findAll({
    where: { parent_id: null }, // Only top-level parents
    attributes: ['id', 'name', 'slug'],
    include: [
      {
        model:      Category,
        as:         'subcategories',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: [
      ['name', 'ASC'],                      // Parents alphabetically
      [{ model: Category, as: 'subcategories' }, 'name', 'ASC'], // Subcats too
    ],
  });

  res.json({ success: true, data: categories });
});

// ─── GET /api/categories/:slug ────────────────────────────────────────────────
// Returns a single category by slug — used when loading a category page
export const getCategoryBySlug = catchAsync(async (req, res) => {
  const category = await Category.findOne({
    where: { slug: req.params.slug },
    attributes: ['id', 'name', 'slug'],
    include: [
      {
        model:      Category,
        as:         'subcategories',
        attributes: ['id', 'name', 'slug'],
      },
      {
        model:      Category,
        as:         'parent',
        attributes: ['id', 'name', 'slug'],
      },
    ],
  });

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.json({ success: true, data: category });
});
