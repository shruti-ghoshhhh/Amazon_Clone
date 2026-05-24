// order.controller.js — Handles checkout, order history, order detail
//
// The most complex controller in the app. placeOrder does:
//   1. Validate the cart isn't empty
//   2. Validate the address belongs to the user
//   3. Check stock for every item
//   4. Create the Order record (financial snapshot)
//   5. Create OrderItem records (price snapshot per item)
//   6. Clear the cart
//   7. Trigger confirmation email (added in Phase 6)
//
// IMPORTANT: Steps 4-6 use a Sequelize TRANSACTION.
// A transaction means: either ALL steps succeed, or NONE do.
// If the server crashes after creating the order but before clearing the cart,
// the transaction rolls back — data stays consistent, no phantom orders.

import sequelize from '../config/database.js';
import { Order, OrderItem, CartItem, Product, ProductImage, Address } from '../models/index.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Body: { address_id }
// Places an order from the user's current cart
export const placeOrder = catchAsync(async (req, res) => {
  const { address_id } = req.body;
  if (!address_id) throw new AppError('address_id is required', 400);

  // Step 1: Verify address belongs to this user
  const address = await Address.findOne({
    where: { id: address_id, user_id: req.user.id },
  });
  if (!address) throw new AppError('Address not found', 404);

  // Step 2: Get all cart items with current product prices
  const cartItems = await CartItem.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'stock_qty', 'is_active'],
      },
    ],
  });

  if (cartItems.length === 0) throw new AppError('Your cart is empty', 400);

  // Step 3: Validate stock for every item before touching the DB
  for (const item of cartItems) {
    if (!item.product.is_active) {
      throw new AppError(`"${item.product.name}" is no longer available`, 400);
    }
    if (item.quantity > item.product.stock_qty) {
      throw new AppError(
        `Only ${item.product.stock_qty} units of "${item.product.name}" available`,
        400
      );
    }
  }

  // Step 4: Calculate financials
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const shipping_fee = subtotal > 499 ? 0 : 40;
  const total = subtotal + shipping_fee;

  // Step 5: Database transaction — all-or-nothing
  // sequelize.transaction() starts a MySQL transaction.
  // If any statement inside throws, the entire transaction rolls back.
  const order = await sequelize.transaction(async (t) => {
    // Create the order
    const newOrder = await Order.create(
      {
        user_id:      req.user.id,
        address_id:   address.id,
        status:       'pending',
        subtotal:     subtotal.toFixed(2),
        shipping_fee: shipping_fee.toFixed(2),
        total:        total.toFixed(2),
      },
      { transaction: t } // All DB calls inside the transaction get { transaction: t }
    );

    // Create one OrderItem per cart item (price snapshot)
    const orderItemsData = cartItems.map((item) => ({
      order_id:   newOrder.id,
      product_id: item.product.id,
      quantity:   item.quantity,
      unit_price: item.product.price, // Snapshot — won't change even if price changes later
    }));
    await OrderItem.bulkCreate(orderItemsData, { transaction: t });

    // Decrement stock for each product
    for (const item of cartItems) {
      await Product.decrement('stock_qty', {
        by: item.quantity,
        where: { id: item.product.id },
        transaction: t,
      });
    }

    // Clear the cart
    await CartItem.destroy({
      where: { user_id: req.user.id },
      transaction: t,
    });

    return newOrder;
  });

  // Step 6: Fetch the full order with items for the response
  const fullOrder = await Order.findByPk(order.id, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price'],
            include: [{
              model: ProductImage, as: 'images',
              where: { is_primary: true }, required: false,
              attributes: ['url'],
            }],
          },
        ],
      },
      { model: Address, as: 'address' },
    ],
  });

  // Trigger order confirmation email in the background (non-blocking)
  sendOrderConfirmationEmail(fullOrder, req.user).catch((err) => {
    console.error('❌ Failed to dispatch order confirmation email in background:', err);
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    data:    fullOrder,
  });
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Returns all past orders for the current user, newest first
export const getOrders = catchAsync(async (req, res) => {
  const orders = await Order.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price'],
            include: [{
              model: ProductImage, as: 'images',
              where: { is_primary: true }, required: false,
              attributes: ['url'],
            }],
          },
        ],
      },
      { model: Address, as: 'address', attributes: ['full_name', 'city', 'state'] },
    ],
    order: [['placed_at', 'DESC']],
  });

  res.json({ success: true, data: orders });
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
// Returns a single order with full detail
export const getOrderById = catchAsync(async (req, res) => {
  const order = await Order.findOne({
    where: {
      id:      req.params.id,
      user_id: req.user.id, // Security: users can only see their own orders
    },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'rating'],
            include: [{
              model: ProductImage, as: 'images',
              where: { is_primary: true }, required: false,
              attributes: ['url'],
            }],
          },
        ],
      },
      { model: Address, as: 'address' },
    ],
  });

  if (!order) throw new AppError('Order not found', 404);

  res.json({ success: true, data: order });
});

// Helper to initialize Razorpay
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Razorpay credentials are not configured on the server', 500);
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─── POST /api/orders/razorpay ────────────────────────────────────────────────
// Body: { address_id }
// Validates stock/address and creates a transaction on Razorpay
export const createRazorpayOrder = catchAsync(async (req, res) => {
  const { address_id } = req.body;
  if (!address_id) throw new AppError('address_id is required', 400);

  // 1. Verify address belongs to this user
  const address = await Address.findOne({
    where: { id: address_id, user_id: req.user.id },
  });
  if (!address) throw new AppError('Address not found', 404);

  // 2. Get all cart items
  const cartItems = await CartItem.findAll({
    where: { user_id: req.user.id },
    include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'stock_qty', 'is_active'] }],
  });

  if (cartItems.length === 0) throw new AppError('Your cart is empty', 400);

  // 3. Validate stock
  for (const item of cartItems) {
    if (!item.product.is_active) throw new AppError(`"${item.product.name}" is no longer available`, 400);
    if (item.quantity > item.product.stock_qty) {
      throw new AppError(`Only ${item.product.stock_qty} units of "${item.product.name}" available`, 400);
    }
  }

  // 4. Calculate total
  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  const shipping_fee = subtotal > 499 ? 0 : 40;
  const total = subtotal + shipping_fee;

  // 4.1. Prevent Razorpay checkout for amounts > 500000
  if (total > 500000) {
    throw new AppError('Amount exceeds maximum allowed for online payment. Please use Cash on Delivery.', 400);
  }

  // 5. Initialize Razorpay and create order
  const razorpay = getRazorpayInstance();
  const options = {
    amount: Math.round(total * 100), // Razorpay amount is in paise
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
  };

  const rzpOrder = await razorpay.orders.create(options);

  res.status(201).json({
    success: true,
    data: {
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      total: total.toFixed(2),
    },
  });
});

// ─── POST /api/orders/verify ──────────────────────────────────────────────────
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, address_id }
// Validates cryptographic signature and records order on DB
export const verifyRazorpayPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !address_id) {
    throw new AppError('All signature parameters and address_id are required', 400);
  }

  // 1. Verify cryptographic signature
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generated_signature = hmac.digest('hex');

  if (generated_signature !== razorpay_signature) {
    throw new AppError('Payment signature verification failed. Untrusted request.', 400);
  }

  // 2. Double check address
  const address = await Address.findOne({
    where: { id: address_id, user_id: req.user.id },
  });
  if (!address) throw new AppError('Address not found', 404);

  // 3. Fetch cart items
  const cartItems = await CartItem.findAll({
    where: { user_id: req.user.id },
    include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'stock_qty', 'is_active'] }],
  });
  if (cartItems.length === 0) throw new AppError('Your cart is empty', 400);

  // 4. Calculate financials
  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  const shipping_fee = subtotal > 499 ? 0 : 40;
  const total = subtotal + shipping_fee;

  // 5. Database transaction to complete order placement
  const order = await sequelize.transaction(async (t) => {
    // Create local order with status 'confirmed' (payment verified!)
    const newOrder = await Order.create(
      {
        user_id:      req.user.id,
        address_id:   address.id,
        status:       'confirmed',
        subtotal:     subtotal.toFixed(2),
        shipping_fee: shipping_fee.toFixed(2),
        total:        total.toFixed(2),
      },
      { transaction: t }
    );

    // Create OrderItems
    const orderItemsData = cartItems.map((item) => ({
      order_id:   newOrder.id,
      product_id: item.product.id,
      quantity:   item.quantity,
      unit_price: item.product.price,
    }));
    await OrderItem.bulkCreate(orderItemsData, { transaction: t });

    // Decrement stock
    for (const item of cartItems) {
      await Product.decrement('stock_qty', {
        by: item.quantity,
        where: { id: item.product.id },
        transaction: t,
      });
    }

    // Clear user cart
    await CartItem.destroy({
      where: { user_id: req.user.id },
      transaction: t,
    });

    return newOrder;
  });

  // 6. Fetch fully structured order object
  const fullOrder = await Order.findByPk(order.id, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product, as: 'product', attributes: ['id', 'name', 'price'],
          include: [{ model: ProductImage, as: 'images', where: { is_primary: true }, required: false, attributes: ['url'] }]
        }],
      },
      { model: Address, as: 'address' },
    ],
  });

  // 7. Dispatch confirmation email in background
  sendOrderConfirmationEmail(fullOrder, req.user).catch((err) => {
    console.error('❌ Failed to dispatch order confirmation email in background:', err);
  });

  res.status(201).json({
    success: true,
    message: 'Payment verified and order created successfully!',
    data: fullOrder,
  });
});
