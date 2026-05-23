// Category.js — Sequelize model for the `categories` table
//
// The interesting part here is the SELF-REFERENTIAL relationship.
// parent_id points back to the same table — this is how we model
// a hierarchy like:
//
//   Electronics (parent_id: null)
//     └── Phones (parent_id: Electronics.id)
//     └── Laptops (parent_id: Electronics.id)
//   Clothing (parent_id: null)
//     └── Men's (parent_id: Clothing.id)
//
// This is called an Adjacency List — simple and effective for 1-2 levels deep.
// The self-referential association is defined in index.js.

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    slug: {
      // A slug is a URL-friendly version of the name
      // e.g. "Home & Kitchen" → "home-kitchen"
      // Used in URLs: /products?category=home-kitchen
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    parent_id: {
      // Self-referential FK — nullable because top-level categories have no parent
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories', // References the same table
        key: 'id',
      },
    },
  },
  {
    tableName: 'categories',
    timestamps: false,
  }
);

export default Category;
