// seed.js — Database seeder
//
// Run this ONCE after connecting to Railway MySQL:
//   node src/seeders/seed.js
//
// It will:
//   1. Drop & recreate all tables (force: true)
//   2. Insert parent categories → subcategories
//   3. Insert 50+ products with real image URLs
//   4. Insert a default test user (test@amazon.com / password123)
//   5. Insert sample addresses + orders for that user
//
// WHY FORCE SYNC?
// { force: true } drops all tables and recreates them cleanly.
// Only safe to use in seeding — NEVER in production startup.
// We use it here so you can re-run the seeder anytime to reset data.

import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import {
  User, Category, Product, ProductImage,
  Address, Order, OrderItem
} from '../models/index.js';

// ─── Helpers ───────────────────────────────────────────────────────────────────

// slugify: "Home & Kitchen" → "home-kitchen"
const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

const parentCategories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Clothing', slug: 'clothing' },
  { name: 'Books', slug: 'books' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
  { name: 'Toys & Games', slug: 'toys-games' },
  { name: 'Beauty & Personal Care', slug: 'beauty' },
  { name: 'Grocery', slug: 'grocery' },
  { name: 'Automotive', slug: 'automotive' },
  { name: 'Garden', slug: 'garden' },
];

// Subcategories are defined with a parentSlug reference
const subCategories = [
  // Electronics
  { name: 'Smartphones', slug: 'smartphones', parentSlug: 'electronics' },
  { name: 'Laptops', slug: 'laptops', parentSlug: 'electronics' },
  { name: 'Headphones', slug: 'headphones', parentSlug: 'electronics' },
  { name: 'Cameras', slug: 'cameras', parentSlug: 'electronics' },
  // Clothing
  { name: "Men's", slug: 'mens-clothing', parentSlug: 'clothing' },
  { name: "Women's", slug: 'womens-clothing', parentSlug: 'clothing' },
  // Books
  { name: 'Fiction', slug: 'fiction', parentSlug: 'books' },
  { name: 'Non-Fiction', slug: 'non-fiction', parentSlug: 'books' },
  // Home
  { name: 'Cookware', slug: 'cookware', parentSlug: 'home-kitchen' },
  { name: 'Furniture', slug: 'furniture', parentSlug: 'home-kitchen' },
];

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
// Each product references its category by slug (resolved to UUID below)
// Images are real Unsplash URLs — stable and freely accessible

const productData = [
  // ── SMARTPHONES ─────────────────────────────────────────────────────────────
  {
    categorySlug: 'smartphones',
    name: 'Apple iPhone 15 Pro (256GB) — Natural Titanium',
    description: 'Featuring the A17 Pro chip, a stunning 48MP main camera system with 5x optical zoom, and a durable titanium design. The Super Retina XDR display delivers exceptional brightness and color accuracy.',
    price: 134900.00,
    stock_qty: 45,
    rating: 4.80,
    review_count: 2341,
    images: [
      { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80', is_primary: false, display_order: 2 },
      { url: 'https://images.unsplash.com/photo-1574755393849-623942496936?w=800&q=80', is_primary: false, display_order: 3 },
    ],
  },
  {
    categorySlug: 'smartphones',
    name: 'Samsung Galaxy S24 Ultra (512GB) — Titanium Black',
    description: 'The most powerful Galaxy ever. Featuring the built-in S Pen, a 200MP quad-camera system, and a Snapdragon 8 Gen 3 processor. 12GB RAM ensures multitasking stays effortless.',
    price: 129999.00,
    stock_qty: 38,
    rating: 4.70,
    review_count: 1876,
    images: [
      { url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', is_primary: false, display_order: 2 },
      { url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80', is_primary: false, display_order: 3 },
    ],
  },
  {
    categorySlug: 'smartphones',
    name: 'OnePlus 12 (256GB) — Silky Black',
    description: 'Powered by Snapdragon 8 Gen 3 with Hasselblad-tuned cameras. 100W SUPERVOOC charging takes you from 0 to 100% in just 26 minutes. The 6.82" 2K ProXDR display is stunning.',
    price: 64999.00,
    stock_qty: 60,
    rating: 4.60,
    review_count: 987,
    images: [
      { url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'smartphones',
    name: 'Google Pixel 8 Pro (128GB) — Bay',
    description: 'The smartest Pixel yet. Google AI features like Best Take, Magic Eraser, and Call Screen. The triple rear camera with 50MP main sensor delivers pro-level photography.',
    price: 84999.00,
    stock_qty: 30,
    rating: 4.55,
    review_count: 654,
    images: [
      { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── LAPTOPS ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'laptops',
    name: 'Apple MacBook Air 15" M3 (16GB/512GB) — Midnight',
    description: 'Supercharged by M3, the 15-inch MacBook Air features an immersive Liquid Retina display and up to 18 hours of battery life. Thin, light, and fanless — silent performance all day.',
    price: 149900.00,
    stock_qty: 25,
    rating: 4.90,
    review_count: 1203,
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80', is_primary: false, display_order: 2 },
      { url: 'https://images.unsplash.com/photo-1611186871525-4ced2e1df5ca?w=800&q=80', is_primary: false, display_order: 3 },
    ],
  },
  {
    categorySlug: 'laptops',
    name: 'Dell XPS 15 (Intel i9 / 32GB / 1TB) — Platinum Silver',
    description: 'A 15.6" OLED 3.5K touchscreen with 100% DCI-P3 color. Intel 13th Gen i9 paired with NVIDIA GeForce RTX 4070. The go-to for creative professionals.',
    price: 189990.00,
    stock_qty: 15,
    rating: 4.65,
    review_count: 432,
    images: [
      { url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'laptops',
    name: 'Asus ROG Zephyrus G14 (AMD Ryzen 9 / 16GB / 1TB)',
    description: 'The ultimate compact gaming laptop. AMD Ryzen 9 7940HS + NVIDIA RTX 4060. A 14" 165Hz QHD display. Weighs just 1.65kg — gaming anywhere just got real.',
    price: 139990.00,
    stock_qty: 20,
    rating: 4.75,
    review_count: 765,
    images: [
      { url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── HEADPHONES ──────────────────────────────────────────────────────────────
  {
    categorySlug: 'headphones',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-leading noise cancellation with 8 microphones and two processors. 30-hour battery with quick charge. Crystal clear hands-free calling. Foldable and ultra-light at 250g.',
    price: 26990.00,
    stock_qty: 85,
    rating: 4.85,
    review_count: 3421,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', is_primary: false, display_order: 2 },
      { url: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=800&q=80', is_primary: false, display_order: 3 },
    ],
  },
  {
    categorySlug: 'headphones',
    name: 'Apple AirPods Pro (2nd Gen) with MagSafe Case',
    description: 'Up to 2x more Active Noise Cancellation. Adaptive Audio seamlessly blends ANC and Transparency mode. Personalised Spatial Audio with head tracking. Up to 30 hours total battery.',
    price: 24900.00,
    stock_qty: 120,
    rating: 4.70,
    review_count: 5632,
    images: [
      { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1588423771073-b8903febb85b?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'headphones',
    name: 'Bose QuietComfort 45 Bluetooth Headphones — White Smoke',
    description: 'High-fidelity audio with world-class noise cancellation. Bose TriPort acoustic architecture. 24 hours of battery. Aware Mode for transparent listening.',
    price: 29900.00,
    stock_qty: 50,
    rating: 4.60,
    review_count: 1876,
    images: [
      { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── CAMERAS ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'cameras',
    name: 'Sony Alpha A7 IV Full-Frame Mirrorless Camera (Body Only)',
    description: '33MP full-frame BSI CMOS sensor. 4K 60p video. 759 phase-detect AF points with real-time Eye AF. 10 fps burst shooting. The benchmark for hybrid shooters.',
    price: 253990.00,
    stock_qty: 12,
    rating: 4.88,
    review_count: 876,
    images: [
      { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'cameras',
    name: 'Canon EOS R50 Mirrorless Camera with 18-45mm Lens',
    description: 'Perfect for content creators. 24.2MP APS-C sensor, 4K video, in-camera vertical video shooting. Dual Pixel CMOS AF with subject tracking. Compact and beginner-friendly.',
    price: 74995.00,
    stock_qty: 30,
    rating: 4.55,
    review_count: 432,
    images: [
      { url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── MEN'S CLOTHING ──────────────────────────────────────────────────────────
  {
    categorySlug: 'mens-clothing',
    name: "Levi's Men's 511 Slim Fit Jeans — Dark Stonewash",
    description: "A modern slim fit that sits below the waist and is slim through the thigh, with a leg opening of 14.25\". Made from 99% cotton, 1% elastane for slight stretch. Classic 5-pocket styling.",
    price: 2999.00,
    stock_qty: 200,
    rating: 4.40,
    review_count: 4521,
    images: [
      { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'mens-clothing',
    name: "Allen Solly Men's Regular Fit Formal Shirt — Sky Blue",
    description: 'Premium cotton formal shirt with a spread collar and full placket. Easy-care fabric with a wrinkle-resistant finish. Perfect for boardroom to client meetings.',
    price: 1299.00,
    stock_qty: 150,
    rating: 4.20,
    review_count: 2134,
    images: [
      { url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'mens-clothing',
    name: 'Nike Men\'s Dri-FIT Running T-Shirt — Black',
    description: 'Sweat-wicking fabric helps keep you dry and comfortable during your run. Lightweight, breathable Dri-FIT technology. Reflective elements for low-light visibility.',
    price: 1495.00,
    stock_qty: 300,
    rating: 4.50,
    review_count: 3210,
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── WOMEN'S CLOTHING ────────────────────────────────────────────────────────
  {
    categorySlug: 'womens-clothing',
    name: "Global Desi Women's Floral Kurta — Multicolour",
    description: 'A stunning floral print kurta in viscose rayon fabric. Features a round neck, 3/4 sleeves, and delicate embroidery at the hem. Pairs beautifully with palazzos or leggings.',
    price: 1799.00,
    stock_qty: 180,
    rating: 4.30,
    review_count: 1876,
    images: [
      { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b5a8e?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'womens-clothing',
    name: "Zara Women's High-Rise Straight Fit Jeans — Ecru",
    description: 'On-trend straight leg with a high rise. Crafted from structured denim that holds its shape. Five pockets and belt loops. Versatile for both casual and semi-formal looks.',
    price: 3490.00,
    stock_qty: 90,
    rating: 4.45,
    review_count: 987,
    images: [
      { url: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── BOOKS ───────────────────────────────────────────────────────────────────
  {
    categorySlug: 'fiction',
    name: 'Atomic Habits — James Clear (Paperback)',
    description: 'The #1 New York Times bestseller. An easy and proven way to build good habits and break bad ones. Over 10 million copies sold worldwide. A life-changing book on the science of small improvements.',
    price: 399.00,
    stock_qty: 500,
    rating: 4.90,
    review_count: 87432,
    images: [
      { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'fiction',
    name: 'The Alchemist — Paulo Coelho (Paperback)',
    description: "Paulo Coelho's masterpiece tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. A timeless classic in over 80 languages.",
    price: 299.00,
    stock_qty: 600,
    rating: 4.75,
    review_count: 54321,
    images: [
      { url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'non-fiction',
    name: 'The Psychology of Money — Morgan Housel (Paperback)',
    description: 'Timeless lessons on wealth, greed, and happiness. 19 short stories exploring the strange ways people think about money and teaching you how to make better sense of one of life\'s most important topics.',
    price: 349.00,
    stock_qty: 450,
    rating: 4.85,
    review_count: 43210,
    images: [
      { url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── HOME & KITCHEN ──────────────────────────────────────────────────────────
  {
    categorySlug: 'cookware',
    name: 'Prestige Omega Deluxe Granite Kadai Set (3 Pcs)',
    description: 'Hard anodized body with granite non-stick coating. Induction compatible. Includes 24cm kadai, 26cm tawa, and 20cm sauce pan. PFOA-free and dishwasher safe.',
    price: 3299.00,
    stock_qty: 95,
    rating: 4.35,
    review_count: 2341,
    images: [
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1584990347449-a2d4c2e0c630?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'cookware',
    name: 'Philips HD3139 Viva Collection Rice Cooker (1.8L)',
    description: 'One-touch cooking with keep-warm function. 700W with inner non-stick bowl. Includes rice measuring cup and spatula. Makes 10 cups of cooked rice. Auto-switches to keep warm.',
    price: 2995.00,
    stock_qty: 70,
    rating: 4.25,
    review_count: 1654,
    images: [
      { url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'furniture',
    name: 'AmazonBasics High-Back Mesh Office Chair with Lumbar Support',
    description: 'Breathable mesh back for airflow and comfort during long work hours. Adjustable height, tilt tension, and 360° swivel. Padded armrests. Supports up to 102kg.',
    price: 8999.00,
    stock_qty: 40,
    rating: 4.15,
    review_count: 3210,
    images: [
      { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'home-kitchen',
    name: 'Dyson V12 Detect Slim Cordless Vacuum Cleaner',
    description: 'The laser detects invisible dust. HEPA filtration. Up to 60 minutes of fade-free suction. The LCD screen shows live count of particles destroyed. Lightweight at 2.2kg.',
    price: 52900.00,
    stock_qty: 22,
    rating: 4.70,
    review_count: 876,
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── SPORTS & OUTDOORS ───────────────────────────────────────────────────────
  {
    categorySlug: 'sports-outdoors',
    name: "Nivia Storm Football — FIFA Approved (Size 5)",
    description: "FIFA-quality approved football for match play. 32-panel hand-stitched construction with butyl bladder for air retention. Suitable for all weather conditions. Official match size and weight.",
    price: 899.00,
    stock_qty: 250,
    rating: 4.30,
    review_count: 4321,
    images: [
      { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'sports-outdoors',
    name: 'Decathlon Btwin Riverside 120 Hybrid Cycle (26 inch)',
    description: "A city hybrid bike designed for daily commuting on all road types. 6-speed Shimano gearing, V-brakes, and an ergonomic saddle. Kickstand included. Ideal for riders 5'2\"–5'9\".",
    price: 11999.00,
    stock_qty: 18,
    rating: 4.50,
    review_count: 1234,
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'sports-outdoors',
    name: 'Adidas Ultraboost 22 Running Shoes — Core Black',
    description: 'The Ultraboost 22 features a fully redesigned midsole geometry for smoother, more comfortable stride. Boost midsole for energy return. Primeknit+ upper adapts to your foot.',
    price: 15999.00,
    stock_qty: 65,
    rating: 4.65,
    review_count: 2876,
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'sports-outdoors',
    name: 'Boldfit Adjustable Dumbbell Set 2-20kg — Chrome',
    description: 'Quick-adjust dial selects from 2kg to 20kg in 2kg increments. Replaces 10 pairs of dumbbells. Anti-slip grip handle. Comes with storage tray. Ideal for home gym.',
    price: 12499.00,
    stock_qty: 35,
    rating: 4.45,
    review_count: 987,
    images: [
      { url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── TOYS & GAMES ────────────────────────────────────────────────────────────
  {
    categorySlug: 'toys-games',
    name: 'LEGO Technic McLaren Senna GTR 42123 (830 Pieces)',
    description: 'Recreate the iconic McLaren Senna GTR with working V8 engine pistons, opening doors and hood. Great for ages 10+. Includes a display plaque. 830 pieces. Measures 35cm long.',
    price: 5999.00,
    stock_qty: 45,
    rating: 4.80,
    review_count: 2134,
    images: [
      { url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'toys-games',
    name: 'Funskool Monopoly Classic Board Game',
    description: 'The classic property trading game for the whole family. 2–8 players, ages 8 and up. Buy, sell, and trade iconic properties. Includes gameboard, 8 tokens, 32 hotels, 2 dice, and 200 banknotes.',
    price: 649.00,
    stock_qty: 300,
    rating: 4.35,
    review_count: 9876,
    images: [
      { url: 'https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1606503153255-59d5e417e6f8?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── BEAUTY & PERSONAL CARE ──────────────────────────────────────────────────
  {
    categorySlug: 'beauty',
    name: 'Dyson Airwrap Multi-Styler Complete (Long) — Vinca Blue',
    description: 'Styles, waves, curls, and dries simultaneously without extreme heat. Uses the Coanda effect to attract and wrap hair. Includes 8 attachments. For long hair up to shoulder-length+.',
    price: 44900.00,
    stock_qty: 30,
    rating: 4.75,
    review_count: 3421,
    images: [
      { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'beauty',
    name: 'L\'Oreal Paris Revitalift 1.5% Pure Hyaluronic Acid Serum (30ml)',
    description: 'Concentrated anti-aging face serum with 1.5% hyaluronic acid. Visibly reduces wrinkles, plumps skin, and provides intense hydration in 1 week. Fragrance-free. Suitable for all skin types.',
    price: 799.00,
    stock_qty: 200,
    rating: 4.40,
    review_count: 8765,
    images: [
      { url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── GROCERY ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'grocery',
    name: 'Tata Salt Lite (Low Sodium) — 1kg',
    description: 'Tata Salt Lite has 15% less sodium than regular salt, which helps in maintaining a healthy heart. Iodized for thyroid health. Consistent granule size for easy measuring.',
    price: 32.00,
    stock_qty: 1000,
    rating: 4.10,
    review_count: 43210,
    images: [
      { url: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'grocery',
    name: 'Nescafé Classic Instant Coffee — 200g',
    description: 'Rich aroma and full-bodied taste made from 100% natural coffee. Crafted from roasted coffee beans. Instantly dissolves in hot or cold water. No artificial flavors.',
    price: 499.00,
    stock_qty: 800,
    rating: 4.50,
    review_count: 32100,
    images: [
      { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'grocery',
    name: 'Quaker Oats — 2kg',
    description: '100% whole grain oats. No added sugar or salt. A heart-healthy breakfast choice rich in soluble fiber (beta-glucan). Ready in 3 minutes. Versatile for oatmeal, smoothies, and baking.',
    price: 329.00,
    stock_qty: 600,
    rating: 4.45,
    review_count: 21000,
    images: [
      { url: 'https://images.unsplash.com/photo-1614961233967-9d7b436df4af?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── AUTOMOTIVE ──────────────────────────────────────────────────────────────
  {
    categorySlug: 'automotive',
    name: 'Michelin Pilot Sport 4 Tyre — 205/55 R16 91V',
    description: 'Ultra-high performance summer tyre. Dynamic Response Technology for precise steering. Bi-Compound technology for shorter braking distances on both wet and dry roads.',
    price: 8990.00,
    stock_qty: 55,
    rating: 4.70,
    review_count: 1234,
    images: [
      { url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'automotive',
    name: 'Bosch S5 Car Battery — 60Ah (12V)',
    description: 'Powerful starting performance in all temperatures. AGM technology handles high electrical loads. Compatible with start-stop vehicles. 3-year guarantee. Maintenance-free.',
    price: 5499.00,
    stock_qty: 40,
    rating: 4.40,
    review_count: 876,
    images: [
      { url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── GARDEN ──────────────────────────────────────────────────────────────────
  {
    categorySlug: 'garden',
    name: 'Ugaoo Garden Tool Set — 5 Piece Stainless Steel',
    description: 'Set includes trowel, transplanter, cultivator, weeder, and hand fork. Rustproof stainless steel blades with ergonomic rubberized handles. Comes in a canvas storage bag.',
    price: 799.00,
    stock_qty: 120,
    rating: 4.30,
    review_count: 2341,
    images: [
      { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'garden',
    name: 'Ugaoo Money Plant Golden Pothos with Pot',
    description: 'Easy-care indoor air-purifying plant. Thrives in low light and indirect sun. Grows quickly with minimal watering. Comes in a 4-inch nursery pot. Perfect desk or shelf plant.',
    price: 299.00,
    stock_qty: 200,
    rating: 4.55,
    review_count: 5432,
    images: [
      { url: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1484254715611-4fd7de088a1d?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },

  // ── ELECTRONICS (parent category directly) ──────────────────────────────────
  {
    categorySlug: 'electronics',
    name: 'Samsung 55" Crystal 4K UHD Smart TV (UA55CU7700)',
    description: 'Crystal Processor 4K upscales all your content to stunning 4K quality. PurColor technology produces billions of color shades. Smart TV with Netflix, Prime, Disney+ built in. Q-Symphony sound.',
    price: 52990.00,
    stock_qty: 18,
    rating: 4.60,
    review_count: 3456,
    images: [
      { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1546032996-6dfacbacbf3f?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'electronics',
    name: 'Amazon Echo Dot (5th Gen) Smart Speaker — Charcoal',
    description: 'Our best-sounding Echo Dot yet. Bigger vocals, deeper bass. Built-in Alexa for music, calls, smart home control, and more. Eero mesh Wi-Fi built in. Works with Alexa routines.',
    price: 4499.00,
    stock_qty: 200,
    rating: 4.55,
    review_count: 12345,
    images: [
      { url: 'https://images.unsplash.com/photo-1512446816042-444d641267d4?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
  {
    categorySlug: 'electronics',
    name: 'Anker 737 Power Bank (PowerCore 24K) — 24000mAh',
    description: '200W total output — charges MacBook in ~45 mins. Smart digital display shows exact battery %, input/output wattage. Charges 3 devices simultaneously. Smart charging tech.',
    price: 8999.00,
    stock_qty: 75,
    rating: 4.65,
    review_count: 4321,
    images: [
      { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80', is_primary: true, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80', is_primary: false, display_order: 2 },
    ],
  },
];

// ─── MAIN SEED FUNCTION ────────────────────────────────────────────────────────

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Step 1: Force sync — drops all tables and recreates them
    // WARNING: This destroys all existing data. Only use for seeding.
    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated.\n');

    // Step 2: Insert parent categories
    console.log('📂 Seeding parent categories...');
    const createdParents = await Category.bulkCreate(parentCategories);
    // Build a slug → model map for easy lookup
    const categoryMap = {};
    createdParents.forEach(c => { categoryMap[c.slug] = c; });
    console.log(`   ✅ ${createdParents.length} parent categories created.\n`);

    // Step 3: Insert subcategories (resolve parent_id from slug)
    console.log('📁 Seeding subcategories...');
    const subCategoryData = subCategories.map(sub => ({
      name: sub.name,
      slug: sub.slug,
      parent_id: categoryMap[sub.parentSlug]?.id ?? null,
    }));
    const createdSubs = await Category.bulkCreate(subCategoryData);
    createdSubs.forEach(c => { categoryMap[c.slug] = c; });
    console.log(`   ✅ ${createdSubs.length} subcategories created.\n`);

    // Step 4: Insert products + their images
    console.log('📦 Seeding products and images...');
    let productCount = 0;
    let imageCount = 0;

    for (const p of productData) {
      const category = categoryMap[p.categorySlug];
      if (!category) {
        console.warn(`   ⚠️  Category not found for slug: ${p.categorySlug}`);
        continue;
      }

      // Assign is_prime and delivery_days dynamically
      // 0: today, 1: tomorrow, 2: 2 days, 3: standard.
      // Make standard delivery (3 days) non-prime, others prime.
      const deliveryDays = productCount % 4;
      const isPrime = deliveryDays !== 3;

      const product = await Product.create({
        category_id: category.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock_qty: p.stock_qty,
        rating: p.rating,
        review_count: p.review_count,
        is_prime: isPrime,
        delivery_days: deliveryDays,
        is_active: true,
      });

      // Insert all images for this product
      const imageData = p.images.map(img => ({
        product_id: product.id,
        url: img.url,
        is_primary: img.is_primary,
        display_order: img.display_order,
      }));
      await ProductImage.bulkCreate(imageData);

      productCount++;
      imageCount += imageData.length;
    }
    console.log(`   ✅ ${productCount} products created.`);
    console.log(`   ✅ ${imageCount} product images created.\n`);

    // Step 5: Create default test user
    console.log('👤 Creating test user...');
    // bcrypt.hash(password, saltRounds) — saltRounds=10 is the industry standard
    // Higher = slower hash (harder to brute force), but 10 is the sweet spot
    const passwordHash = await bcrypt.hash('password123', 10);
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@amazon.com',
      password_hash: passwordHash,
    });
    console.log('   ✅ Test user: test@amazon.com / password123\n');

    // Step 6: Create a default address for the test user
    console.log('📍 Creating sample address...');
    const address = await Address.create({
      user_id: testUser.id,
      full_name: 'Test User',
      line1: '42 MG Road',
      line2: 'Apt 3B',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      is_default: true,
    });
    console.log('   ✅ Sample address created.\n');

    // Step 7: Create a sample completed order
    console.log('🛒 Creating sample order...');
    const sampleProducts = await Product.findAll({ limit: 3 });

    const subtotal = sampleProducts.reduce((sum, p) => sum + parseFloat(p.price), 0);
    const shipping_fee = subtotal > 499 ? 0 : 40;
    const total = subtotal + shipping_fee;

    const order = await Order.create({
      user_id: testUser.id,
      address_id: address.id,
      status: 'delivered',
      subtotal: subtotal.toFixed(2),
      shipping_fee: shipping_fee.toFixed(2),
      total: total.toFixed(2),
      placed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    });

    const orderItems = sampleProducts.map(p => ({
      order_id: order.id,
      product_id: p.id,
      quantity: 1,
      unit_price: p.price,
    }));
    await OrderItem.bulkCreate(orderItems);
    console.log(`   ✅ Sample order created with ${orderItems.length} items.\n`);

    console.log('🎉 Seeding complete!');
    console.log('─────────────────────────────────────────────');
    console.log(`   Categories : ${Object.keys(categoryMap).length}`);
    console.log(`   Products   : ${productCount}`);
    console.log(`   Images     : ${imageCount}`);
    console.log(`   Users      : 1 (test@amazon.com / password123)`);
    console.log(`   Orders     : 1 (delivered)`);
    console.log('─────────────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
