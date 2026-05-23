// product.controller.js — Handler functions for product-related routes
//
// Each function here is called by the router when a matching request comes in.
// They follow the pattern: query DB → shape response → send JSON.
//
// We use catchAsync (from errorHandler) to wrap every async function
// so we don't repeat try/catch in every handler.
//
// Sequelize query tools used here:
//   findAndCountAll  → returns { count, rows } — perfect for pagination
//   findByPk         → find one record by primary key (UUID)
//   Op.iLike         → case-insensitive LIKE search (MySQL: Op.like)
//   include          → eager load related models (JOIN equivalent)

import { Op } from 'sequelize';
import { Product, ProductImage, Category } from '../models/index.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// ─── GET /api/products ─────────────────────────────────────────────────────────
// Supports: ?search=  ?category=  ?sort=  ?page=  ?limit=
export const getProducts = catchAsync(async (req, res) => {
  const {
    search   = '',
    category = '',   // category slug, e.g. "smartphones"
    sort     = 'newest',
    page     = 1,
    limit    = 20,
    minPrice = '',
    maxPrice = '',
    rating   = '',
    prime    = '',
    delivery = '',
  } = req.query;

  // ── Build WHERE clause dynamically ──────────────────────────────────────────
  const where = { is_active: true }; // Never return inactive products

  if (search) {
    // Op.like: SQL LIKE '%term%' — matches name containing the search term
    // We use Op.like (not iLike) because MySQL is case-insensitive by default
    where.name = { [Op.like]: `%${search}%` };
  }

  // Price filtering
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
  }

  // Rating filtering
  if (rating) {
    where.rating = { [Op.gte]: parseFloat(rating) };
  }

  // Prime filtering
  if (prime === '1') {
    where.is_prime = true;
  }

  // Delivery filtering
  if (delivery) {
    if (delivery === 'today') {
      where.delivery_days = 0;
    } else if (delivery === 'tomorrow') {
      where.delivery_days = { [Op.lte]: 1 };
    } else if (delivery === '2days') {
      where.delivery_days = { [Op.lte]: 2 };
    }
  }

  // ── Build ORDER clause ───────────────────────────────────────────────────────
  // Sequelize ORDER format: [ [column, direction], ... ]
  const orderMap = {
    newest:     [['created_at', 'DESC']],
    price_asc:  [['price', 'ASC']],
    price_desc: [['price', 'DESC']],
    rating:     [['rating', 'DESC']],
  };
  const order = orderMap[sort] || orderMap.newest;

  // ── Build category include (filter by slug if provided) ──────────────────────
  // We always INCLUDE category so the response has category name + slug.
  // When filtering, we add a WHERE on the Category model.
  const categoryInclude = {
    model:    Category,
    as:       'category',
    attributes: ['id', 'name', 'slug'], // Only return these fields, not all columns
    ...(category && { where: { slug: category } }), // Conditional WHERE on join
  };

  // ── Pagination ───────────────────────────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page));    // Never below page 1
  const limitNum = Math.min(40, parseInt(limit));  // Cap at 40 items per page
  const offset   = (pageNum - 1) * limitNum;       // SQL OFFSET

  // ── Execute query ────────────────────────────────────────────────────────────
  // findAndCountAll returns { count: totalMatchingRows, rows: pageOfResults }
  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [
      categoryInclude,
      {
        model:    ProductImage,
        as:       'images',
        attributes: ['url', 'is_primary', 'display_order'],
        where:    { is_primary: true }, // Only fetch the thumbnail for listing
        required: false,                // LEFT JOIN — products without images still appear
      },
    ],
    order,
    limit:  limitNum,
    offset,
    distinct: true, // Required with include + limit to get accurate count
  });

  res.json({
    success: true,
    data: {
      products:    rows,
      total:       count,
      page:        pageNum,
      totalPages:  Math.ceil(count / limitNum),
      hasNextPage: pageNum < Math.ceil(count / limitNum),
    },
  });
});

// ─── GET /api/products/:id ─────────────────────────────────────────────────────
// Returns full product detail with ALL images (not just primary)
export const getProductById = catchAsync(async (req, res) => {
  const product = await Product.findOne({
    where: {
      id:        req.params.id,
      is_active: true,
    },
    include: [
      {
        model:      Category,
        as:         'category',
        attributes: ['id', 'name', 'slug'],
        include: [
          {
            // Also include the parent category (e.g. "Electronics" for "Smartphones")
            model:      Category,
            as:         'parent',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      },
      {
        model:      ProductImage,
        as:         'images',
        attributes: ['id', 'url', 'is_primary', 'display_order'],
        // Return ALL images ordered by display_order for the carousel
        order:      [['display_order', 'ASC']],
      },
    ],
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Sort images by display_order (Sequelize include doesn't guarantee order)
  if (product.images) {
    product.images.sort((a, b) => a.display_order - b.display_order);
  }

  res.json({ success: true, data: product });
});
