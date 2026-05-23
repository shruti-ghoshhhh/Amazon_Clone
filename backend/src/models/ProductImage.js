// ProductImage.js — Sequelize model for the `product_images` table
//
// One product can have many images (1:N relationship with products).
// This is better than storing a comma-separated list of URLs in the products table
// because each image is its own row — easy to add, remove, reorder.
//
// display_order: Controls which image appears where in the carousel
//   e.g. display_order: 1 = first image shown
//
// is_primary: The ONE image shown as the product thumbnail in listings.
//   Only one image per product should have is_primary = true.

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductImage = sequelize.define(
  'ProductImage',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE', // If a product is deleted, all its images are deleted too
    },
    url: {
      type: DataTypes.STRING(1000), // URLs can be long, give it space
      allowNull: false,
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'product_images',
    timestamps: false,
  }
);

export default ProductImage;
