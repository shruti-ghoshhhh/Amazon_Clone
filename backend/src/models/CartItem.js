// CartItem.js — Sequelize model for the `cart_items` table
//
// The cart is a temporary holding area before checkout.
// Unlike order_items, cart items DON'T store unit_price
// because the price shown in cart is always the CURRENT price
// (this is how Amazon works — prices in cart can change).
//
// When the user places an order, we:
//   1. Read current product.price for each cart item
//   2. Write those prices into order_items.unit_price (snapshot)
//   3. Clear the cart
//
// One user can only have ONE cart item per product.
// If they add the same product again, we just update the quantity.
// We enforce this with a UNIQUE constraint on (user_id, product_id).

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CartItem = sequelize.define(
  'CartItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    added_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'cart_items',
    timestamps: false,
    indexes: [
      {
        // Composite unique index: one product per user per cart
        unique: true,
        fields: ['user_id', 'product_id'],
      },
    ],
  }
);

export default CartItem;
