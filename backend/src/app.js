// app.js — Express application entry point
//
// This file does three things:
//   1. Creates the Express app and configures middleware
//   2. Mounts all API route groups (auth, products, cart, etc.)
//   3. Connects to MySQL and starts the HTTP server
//
// Every request that hits our backend passes through this file first.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import sequelize from './config/database.js';

// Importing models registers them with Sequelize so sync() creates all tables.
// We import the index file which also sets up all associations.
import './models/index.js';


// Route imports — uncommented as each module is built
import productRoutes  from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes     from './routes/cart.routes.js';
import orderRoutes    from './routes/order.routes.js';
import addressRoutes  from './routes/address.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import authRoutes     from './routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
//
// Middleware = functions that run on EVERY request before it hits your routes.
// They process the request in sequence, top to bottom.

// helmet() adds ~15 security-related HTTP headers automatically
// e.g. X-Content-Type-Options, X-Frame-Options, Content-Security-Policy
app.use(helmet());

// cors() allows the frontend (running on port 5173) to call this API
// Without this, browsers block cross-origin requests by default
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies/auth headers to be sent
}));

// express.json() parses incoming request bodies with Content-Type: application/json
// Without this, req.body would be undefined
app.use(express.json());

// morgan('dev') logs every request to the console:
// e.g. "GET /api/products 200 12.345 ms - 1234"
// Invaluable for debugging during development
app.use(morgan('dev'));

// ─── Health Check ──────────────────────────────────────────────────────────────
// Simple endpoint Railway uses to verify the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
// Each router handles a group of related endpoints.
// Mounted in priority order — most frequently hit routes first.
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/addresses',  addressRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/auth',       authRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
// Express identifies error-handling middleware by its 4 arguments: (err, req, res, next)
// Any route that calls next(error) lands here
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Database Sync & Server Start ─────────────────────────────────────────────
// sequelize.authenticate() tests the DB connection
// Then we start the HTTP server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established.');

    // { alter: true } updates table structure if models change
    // DO NOT use { force: true } in production — it drops all tables!
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1); // Exit with failure code so Railway knows something broke
  }
};

startServer();
