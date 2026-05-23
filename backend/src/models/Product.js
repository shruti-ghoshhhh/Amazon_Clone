// Product.js — Sequelize model for the `products` table
//
// Products are the core of the app. Every other feature (cart, orders,
// wishlists) references products by their UUID.
//
// Note on `rating` and `review_count`:
// These are denormalized fields — we store the computed average directly
// on the product row rather than calculating it from a reviews table
// every time. This is a performance trade-off: slightly stale data,
// but much faster reads. Fine for our use case.

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 500],
      },
    },
    description: {
      type: DataTypes.TEXT, // TEXT = unlimited length, unlike VARCHAR(255)
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2), // 10 total digits, 2 after decimal → e.g. 99999999.99
      allowNull: false,
      validate: {
        min: 0, // Price can't be negative
      },
    },
    stock_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2), // e.g. 4.50 — max 3 digits, 2 decimal
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5,
      },
    },
    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_prime: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    delivery_days: {
      type: DataTypes.INTEGER,
      defaultValue: 2, // 0: today, 1: tomorrow, 2: 2 days, 3+: standard
    },
    is_active: {
      // Soft delete flag — instead of deleting a product, we set is_active = false
      // This preserves data integrity (old orders still reference the product)
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'products',
    timestamps: false,
  }
);

export default Product;
