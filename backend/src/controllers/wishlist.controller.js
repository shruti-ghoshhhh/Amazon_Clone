// wishlist.controller.js — Handles user's wishlist endpoints
//
// Endpoints:
//   - GET    /api/wishlist               -> Get all items in current user's wishlist
//   - POST   /api/wishlist               -> Add product to wishlist
//   - DELETE /api/wishlist/:productId    -> Remove product from wishlist

import { Wishlist, Product, ProductImage } from '../models/index.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// ─── GET /api/wishlist ────────────────────────────────────────────────────────
// Returns all products in the current user's wishlist
export const getWishlist = catchAsync(async (req, res) => {
  const items = await Wishlist.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: ProductImage,
            as: 'images',
            where: { is_primary: true },
            required: false,
            attributes: ['url'],
          },
        ],
      },
    ],
    order: [['saved_at', 'DESC']],
  });

  res.json({ success: true, data: items });
});

// ─── POST /api/wishlist ───────────────────────────────────────────────────────
// Body: { product_id }
// Adds a product to the user's wishlist
export const addToWishlist = catchAsync(async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) throw new AppError('product_id is required', 400);

  // Check if product exists
  const product = await Product.findByPk(product_id);
  if (!product) throw new AppError('Product not found', 404);

  // Check if item is already in wishlist
  const existing = await Wishlist.findOne({
    where: { user_id: req.user.id, product_id },
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Product already in wishlist',
      data: existing,
    });
  }

  const newItem = await Wishlist.create({
    user_id: req.user.id,
    product_id,
  });

  const fullItem = await Wishlist.findByPk(newItem.id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: ProductImage,
            as: 'images',
            where: { is_primary: true },
            required: false,
            attributes: ['url'],
          },
        ],
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: 'Product added to wishlist successfully!',
    data: fullItem,
  });
});

// ─── DELETE /api/wishlist/:productId ──────────────────────────────────────────
// Removes a product from the user's wishlist by product_id
export const removeFromWishlist = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const deleted = await Wishlist.destroy({
    where: { user_id: req.user.id, product_id: productId },
  });

  if (!deleted) throw new AppError('Item not found in your wishlist', 404);

  res.json({
    success: true,
    message: 'Product removed from wishlist successfully!',
  });
});
