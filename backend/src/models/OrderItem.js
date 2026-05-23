// OrderItem.js — Sequelize model for the `order_items` table
//
// This is the LINE ITEMS of an order — one row per product in the order.
//
// Example: You order 2 iPhones and 1 charger → 2 rows in order_items:
//   { order_id: X, product_id: iPhone, quantity: 2, unit_price: 79999.00 }
//   { order_id: X, product_id: Charger, quantity: 1, unit_price: 1999.00 }
//
// unit_price: The price AT THE TIME OF PURCHASE.
// This is critical — if Apple raises the iPhone price tomorrow,
// your order history still correctly shows what you paid.
//
// This is a classic "junction table" pattern for the many-to-many
// relationship between orders and products.

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE', // Order deleted → its line items deleted too
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unit_price: {
      // Snapshot of product.price at time of purchase — never changes after creation
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: 'order_items',
    timestamps: false,
  }
);

export default OrderItem;
