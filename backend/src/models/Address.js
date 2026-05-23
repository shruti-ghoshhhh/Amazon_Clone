// Address.js — Sequelize model for the `addresses` table
//
// Users can have multiple saved addresses (think Amazon's address book).
// is_default = true means this address is pre-selected at checkout.
//
// Addresses are stored separately from users so:
//   1. One user can have multiple delivery addresses
//   2. Orders reference the address_id — so even if a user later edits/deletes
//      their address, the order history still shows where it was shipped

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Address = sequelize.define(
  'Address',
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
      onDelete: 'CASCADE', // User deleted → their addresses deleted too
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    line1: {
      type: DataTypes.STRING,
      allowNull: false, // Street address, e.g. "42 MG Road"
    },
    line2: {
      type: DataTypes.STRING,
      allowNull: true, // Apartment/floor — optional
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      // STRING not INTEGER — pincodes like "011001" need leading zeros preserved
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'addresses',
    timestamps: false,
  }
);

export default Address;
