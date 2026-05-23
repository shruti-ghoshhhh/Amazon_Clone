// models/index.js — Central model registry + association definitions
//
// WHY THIS FILE EXISTS:
// Each model file only defines columns. Relationships (foreign keys, joins)
// need to know about multiple models — so we define them HERE, after all
// models are imported, to avoid circular import issues.
//
// SEQUELIZE ASSOCIATIONS EXPLAINED:
//
//   A.hasMany(B)     → A can have multiple B records. Adds B.a_id FK.
//   B.belongsTo(A)   → B has a FK pointing to A.
//   Always define BOTH sides of the relationship for bi-directional queries.
//
//   { foreignKey: 'x' } → override the default FK column name
//   { as: 'alias' }     → name for eager loading: include: [{ model: X, as: 'alias' }]

import User from './User.js';
import Category from './Category.js';
import Product from './Product.js';
import ProductImage from './ProductImage.js';
import Address from './Address.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import CartItem from './CartItem.js';
import Wishlist from './Wishlist.js';

// ─── User Associations ─────────────────────────────────────────────────────────

User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlistItems' });
Wishlist.belongsTo(User, { foreignKey: 'user_id' });

// ─── Category Associations ─────────────────────────────────────────────────────

// Self-referential: a category can have a parent category
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// A category has many products
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ─── Product Associations ──────────────────────────────────────────────────────

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cartEntries' });
CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(Wishlist, { foreignKey: 'product_id', as: 'wishlistEntries' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderEntries' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ─── Order Associations ────────────────────────────────────────────────────────

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Order.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });
Address.hasMany(Order, { foreignKey: 'address_id' });

// ─── Export all models ─────────────────────────────────────────────────────────
// Every other file imports from here — single source of truth for models
export {
  User,
  Category,
  Product,
  ProductImage,
  Address,
  Order,
  OrderItem,
  CartItem,
  Wishlist,
};
