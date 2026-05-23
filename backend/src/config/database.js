// database.js — Sequelize connection configuration
//
// Sequelize is an ORM (Object-Relational Mapper). Instead of writing raw SQL
// like "SELECT * FROM products", we write JS: Product.findAll()
// Sequelize translates that to SQL for us.
//
// We use environment variables (process.env) for all sensitive values
// so they never get hardcoded or pushed to GitHub.

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // Load .env file into process.env

const sequelize = new Sequelize(
  process.env.DB_NAME,     // Database name, e.g. "amazon_clone"
  process.env.DB_USER,     // MySQL username, e.g. "root"
  process.env.DB_PASSWORD, // MySQL password
  {
    host: process.env.DB_HOST,   // Railway MySQL host URL
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',            // Tell Sequelize we're using MySQL
    logging: false,              // Set to console.log to see generated SQL queries
    pool: {
      max: 5,      // Max simultaneous DB connections
      min: 0,      // Min connections to keep alive
      acquire: 30000, // Max ms to wait before throwing error
      idle: 10000     // Max ms a connection can sit idle before release
    }
  }
);

export default sequelize;
