// Order.js — Sequelize model for the `orders` table
//
// An order is created when a user completes checkout.
// It stores the financial snapshot at the moment of purchase:
//   subtotal   = sum of (unit_price × quantity) for all items
//   shipping_fee = calculated at checkout (free above ₹499, else ₹40)
//   total      = subtotal + shipping_fee
//
// WHY STORE SUBTOTAL/TOTAL ON THE ORDER?
// Because prices change over time. If we recalculate from products.price,
// the order total would change every time the product price changes.
// Storing it at purchase time = accurate order history forever.
//
// status flow: pending → confirmed → shipped → delivered

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define(
  'Order',
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
    },
    address_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'addresses',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
      // ENUM restricts values to only these options at the DB level
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    placed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'orders',
    timestamps: false,
  }
);

export default Order;
