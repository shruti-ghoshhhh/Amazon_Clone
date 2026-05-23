// User.js — Sequelize model for the `users` table
//
// A Sequelize model is a JS class that maps to a database table.
// Each property in the model definition = one column in the table.
//
// DataTypes tells Sequelize what MySQL column type to use:
//   DataTypes.UUID       → CHAR(36)
//   DataTypes.STRING     → VARCHAR(255)
//   DataTypes.BOOLEAN    → TINYINT(1)
//   DataTypes.DECIMAL    → DECIMAL(10,2)

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define(
  'User',        // Model name — Sequelize pluralizes this to "users" for the table
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Auto-generate UUID on INSERT
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100], // Name must be 2–100 characters
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,    // No two users can share an email
      validate: {
        isEmail: true, // Sequelize validates email format automatically
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      // We NEVER store plain text passwords.
      // bcryptjs hashes the password before it reaches here.
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'users',  // Explicit table name (avoids Sequelize auto-pluralization quirks)
    timestamps: false,   // We manage created_at ourselves (matches your schema exactly)
  }
);

export default User;
