// address.controller.js — Get and create delivery addresses
//
// Addresses are used in checkout to select where an order ships.
// When adding a new address with is_default: true, we first
// unset is_default on all existing addresses — only one can be default.

import { Address } from '../models/index.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// ─── GET /api/addresses ───────────────────────────────────────────────────────
export const getAddresses = catchAsync(async (req, res) => {
  const addresses = await Address.findAll({
    where:  { user_id: req.user.id },
    order:  [['is_default', 'DESC']], // Default address appears first
  });
  res.json({ success: true, data: addresses });
});

// ─── POST /api/addresses ──────────────────────────────────────────────────────
// Body: { full_name, line1, line2, city, state, pincode, is_default }
export const createAddress = catchAsync(async (req, res) => {
  const { full_name, line1, line2, city, state, pincode, is_default = false } = req.body;

  if (!full_name || !line1 || !city || !state || !pincode) {
    throw new AppError('full_name, line1, city, state, and pincode are required', 400);
  }

  // If this address is marked default, unset all other defaults first
  if (is_default) {
    await Address.update(
      { is_default: false },
      { where: { user_id: req.user.id } }
    );
  }

  const address = await Address.create({
    user_id: req.user.id,
    full_name,
    line1,
    line2: line2 || null,
    city,
    state,
    pincode,
    is_default,
  });

  res.status(201).json({ success: true, data: address });
});

// ─── DELETE /api/addresses/:id ────────────────────────────────────────────────
export const deleteAddress = catchAsync(async (req, res) => {
  const deleted = await Address.destroy({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!deleted) throw new AppError('Address not found', 404);
  res.json({ success: true, message: 'Address deleted' });
});
