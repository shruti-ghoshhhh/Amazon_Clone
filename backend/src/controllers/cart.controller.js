// cart.controller.js — Handler functions for cart CRUD
//
// Cart operations: get, add item, update quantity, remove item.
//
// KEY PATTERN: "Upsert" on add
// If the user adds a product that's already in their cart,
// we INCREMENT the quantity instead of creating a duplicate row.
// Sequelize's findOrCreate + manual update handles this cleanly.
//
// All handlers use req.user.id (set by defaultUser middleware).

import { CartItem, Product, ProductImage } from '../models/index.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// ─── GET /api/cart ─────────────────────────────────────────────────────────────
// Returns all cart items for the current user with full product + image data
export const getCart = catchAsync(async (req, res) => {
  const cartItems = await CartItem.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: Product,
        as:    'product',
        attributes: ['id', 'name', 'price', 'stock_qty', 'rating'],
        include: [
          {
            model:    ProductImage,
            as:       'images',
            attributes: ['url'],
            where:    { is_primary: true },
            required: false, // LEFT JOIN — still show product if no image
          },
        ],
      },
    ],
    order: [['added_at', 'DESC']], // Most recently added first
  });

  // Calculate subtotal server-side for accuracy
  // parseFloat because Sequelize returns DECIMAL as string
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const shipping_fee = subtotal > 499 ? 0 : 40;

  res.json({
    success: true,
    data: {
      items:       cartItems,
      subtotal:    parseFloat(subtotal.toFixed(2)),
      shipping_fee,
      total:       parseFloat((subtotal + shipping_fee).toFixed(2)),
      item_count:  cartItems.reduce((sum, item) => sum + item.quantity, 0),
    },
  });
});

// ─── POST /api/cart ────────────────────────────────────────────────────────────
// Body: { product_id, quantity }
// Adds item to cart. If already in cart, increments quantity.
export const addToCart = catchAsync(async (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) throw new AppError('product_id is required', 400);
  if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);

  // Verify the product exists and is active
  const product = await Product.findOne({
    where: { id: product_id, is_active: true },
  });
  if (!product) throw new AppError('Product not found', 404);

  // Check stock availability
  if (product.stock_qty < quantity) {
    throw new AppError(`Only ${product.stock_qty} units available`, 400);
  }

  // findOrCreate: tries to find an existing row matching the where clause.
  // If found, returns [existingRecord, false].
  // If not found, creates a new row and returns [newRecord, true].
  const [cartItem, created] = await CartItem.findOrCreate({
    where: {
      user_id:    req.user.id,
      product_id: product_id,
    },
    defaults: {
      quantity: quantity,
    },
  });

  // If the item already existed, increment the quantity
  if (!created) {
    const newQty = cartItem.quantity + quantity;
    if (newQty > product.stock_qty) {
      throw new AppError(`Cannot add more. Only ${product.stock_qty} units available`, 400);
    }
    await cartItem.update({ quantity: newQty });
  }

  res.status(created ? 201 : 200).json({
    success: true,
    message: created ? 'Item added to cart' : 'Cart item quantity updated',
    data:    cartItem,
  });
});

// ─── PUT /api/cart/:itemId ─────────────────────────────────────────────────────
// Body: { quantity }
// Updates the quantity of a specific cart item
export const updateCartItem = catchAsync(async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1', 400);

  // Find the cart item — MUST belong to the current user (security check)
  const cartItem = await CartItem.findOne({
    where: {
      id:      req.params.itemId,
      user_id: req.user.id, // Prevents one user from editing another's cart
    },
    include: [{ model: Product, as: 'product', attributes: ['stock_qty'] }],
  });

  if (!cartItem) throw new AppError('Cart item not found', 404);

  if (quantity > cartItem.product.stock_qty) {
    throw new AppError(`Only ${cartItem.product.stock_qty} units available`, 400);
  }

  await cartItem.update({ quantity });

  res.json({ success: true, message: 'Quantity updated', data: cartItem });
});

// ─── DELETE /api/cart/:itemId ──────────────────────────────────────────────────
// Removes a specific item from the cart
export const removeFromCart = catchAsync(async (req, res) => {
  const deleted = await CartItem.destroy({
    where: {
      id:      req.params.itemId,
      user_id: req.user.id, // Security: can only delete own cart items
    },
  });

  if (!deleted) throw new AppError('Cart item not found', 404);

  res.json({ success: true, message: 'Item removed from cart' });
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
// Clears the entire cart — called after a successful order placement
export const clearCart = catchAsync(async (req, res) => {
  await CartItem.destroy({ where: { user_id: req.user.id } });
  res.json({ success: true, message: 'Cart cleared' });
});
