import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedPath = path.join(__dirname, 'seed.js');
let seedContent = fs.readFileSync(seedPath, 'utf8');

const newProductData = `const productData = [
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
    ],
  },
  {
    categorySlug: 'smartphones',
    name: 'OnePlus 12 (256GB) — Silky Black',
    description: 'Powered by Snapdragon 8 Gen 3 with Hasselblad-tuned cameras. 100W SUPERVOOC charging takes you from 0 to 100% in just 26 minutes.',
    price: 64999.00,
    stock_qty: 60,
    rating: 4.60,
    review_count: 987,
    images: [
      { url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'smartphones',
    name: 'Google Pixel 8 Pro (128GB) — Bay',
    description: 'The smartest Pixel yet. Google AI features like Best Take, Magic Eraser, and Call Screen.',
    price: 84999.00,
    stock_qty: 30,
    rating: 4.55,
    review_count: 654,
    images: [
      { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'smartphones',
    name: 'Nothing Phone (2) — Dark Grey',
    description: 'Come to the bright side. Glyph interface, Snapdragon 8+ Gen 1, 50 MP dual camera.',
    price: 39999.00,
    stock_qty: 25,
    rating: 4.5,
    review_count: 421,
    images: [
      { url: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── LAPTOPS ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'laptops',
    name: 'Apple MacBook Air 15" M3 (16GB/512GB) — Midnight',
    description: 'Supercharged by M3, the 15-inch MacBook Air features an immersive Liquid Retina display and up to 18 hours of battery life.',
    price: 149900.00,
    stock_qty: 25,
    rating: 4.90,
    review_count: 1203,
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'laptops',
    name: 'Dell XPS 15 (Intel i9 / 32GB / 1TB) — Platinum Silver',
    description: 'A 15.6" OLED 3.5K touchscreen with 100% DCI-P3 color. Intel 13th Gen i9 paired with NVIDIA GeForce RTX 4070.',
    price: 189990.00,
    stock_qty: 15,
    rating: 4.65,
    review_count: 432,
    images: [
      { url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'laptops',
    name: 'Lenovo IdeaPad Slim 5 — Abyss Blue',
    description: 'Intel Core i5 12th Gen, 16GB RAM, 512GB SSD. Perfect for everyday productivity.',
    price: 54990.00,
    stock_qty: 45,
    rating: 4.3,
    review_count: 671,
    images: [
      { url: 'https://images.unsplash.com/photo-1620023647468-52fbce2d3080?w=800&q=80', is_primary: true, display_order: 1 }
    ]
  },
  
  // ── HEADPHONES ──────────────────────────────────────────────────────────────
  {
    categorySlug: 'headphones',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-leading noise cancellation with 8 microphones and two processors.',
    price: 26990.00,
    stock_qty: 85,
    rating: 4.85,
    review_count: 3421,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'headphones',
    name: 'Apple AirPods Pro (2nd Gen) with MagSafe Case',
    description: 'Up to 2x more Active Noise Cancellation. Adaptive Audio seamlessly blends ANC and Transparency mode.',
    price: 24900.00,
    stock_qty: 120,
    rating: 4.70,
    review_count: 5632,
    images: [
      { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── CAMERAS ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'cameras',
    name: 'Sony Alpha A7 IV Full-Frame Mirrorless Camera (Body Only)',
    description: '33MP full-frame BSI CMOS sensor. 4K 60p video. 759 phase-detect AF points.',
    price: 253990.00,
    stock_qty: 12,
    rating: 4.88,
    review_count: 876,
    images: [
      { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── MEN'S CLOTHING ──────────────────────────────────────────────────────────
  {
    categorySlug: 'mens-clothing',
    name: "Levi's Men's 511 Slim Fit Jeans — Dark Stonewash",
    description: "A modern slim fit that sits below the waist and is slim through the thigh.",
    price: 2999.00,
    stock_qty: 200,
    rating: 4.40,
    review_count: 4521,
    images: [
      { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'mens-clothing',
    name: 'Nike Men\\'s Dri-FIT Running T-Shirt — Black',
    description: 'Sweat-wicking fabric helps keep you dry and comfortable during your run.',
    price: 1495.00,
    stock_qty: 300,
    rating: 4.50,
    review_count: 3210,
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── WOMEN'S CLOTHING ────────────────────────────────────────────────────────
  {
    categorySlug: 'womens-clothing',
    name: "Global Desi Women's Floral Kurta — Multicolour",
    description: 'A stunning floral print kurta in viscose rayon fabric. Features a round neck, 3/4 sleeves, and delicate embroidery at the hem.',
    price: 1799.00,
    stock_qty: 180,
    rating: 4.30,
    review_count: 1876,
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733958-d2597463ead7?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'womens-clothing',
    name: "Zara Women's High-Rise Straight Fit Jeans — Ecru",
    description: 'On-trend straight leg with a high rise. Crafted from structured denim that holds its shape.',
    price: 3490.00,
    stock_qty: 90,
    rating: 4.45,
    review_count: 987,
    images: [
      { url: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── BOOKS ───────────────────────────────────────────────────────────────────
  {
    categorySlug: 'fiction',
    name: 'Atomic Habits — James Clear (Paperback)',
    description: 'The #1 New York Times bestseller. An easy and proven way to build good habits and break bad ones.',
    price: 399.00,
    stock_qty: 500,
    rating: 4.90,
    review_count: 87432,
    images: [
      { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'non-fiction',
    name: 'The Psychology of Money — Morgan Housel (Paperback)',
    description: 'Timeless lessons on wealth, greed, and happiness.',
    price: 349.00,
    stock_qty: 450,
    rating: 4.85,
    review_count: 43210,
    images: [
      { url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── HOME & KITCHEN ──────────────────────────────────────────────────────────
  {
    categorySlug: 'cookware',
    name: 'Prestige Omega Deluxe Granite Kadai Set (3 Pcs)',
    description: 'Hard anodized body with granite non-stick coating. Induction compatible.',
    price: 3299.00,
    stock_qty: 95,
    rating: 4.35,
    review_count: 2341,
    images: [
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'furniture',
    name: 'AmazonBasics High-Back Mesh Office Chair',
    description: 'Breathable mesh back for airflow and comfort during long work hours.',
    price: 8999.00,
    stock_qty: 40,
    rating: 4.15,
    review_count: 3210,
    images: [
      { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── SPORTS & OUTDOORS ───────────────────────────────────────────────────────
  {
    categorySlug: 'sports-outdoors',
    name: "Nivia Storm Football — FIFA Approved (Size 5)",
    description: "FIFA-quality approved football for match play.",
    price: 899.00,
    stock_qty: 250,
    rating: 4.30,
    review_count: 4321,
    images: [
      { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'sports-outdoors',
    name: 'Adidas Ultraboost 22 Running Shoes — Core Black',
    description: 'The Ultraboost 22 features a fully redesigned midsole geometry for smoother, more comfortable stride.',
    price: 15999.00,
    stock_qty: 65,
    rating: 4.65,
    review_count: 2876,
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── TOYS & GAMES ────────────────────────────────────────────────────────────
  {
    categorySlug: 'toys-games',
    name: 'LEGO Technic McLaren Senna GTR 42123 (830 Pieces)',
    description: 'Recreate the iconic McLaren Senna GTR with working V8 engine pistons.',
    price: 5999.00,
    stock_qty: 45,
    rating: 4.80,
    review_count: 2134,
    images: [
      { url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── BEAUTY & PERSONAL CARE ──────────────────────────────────────────────────
  {
    categorySlug: 'beauty',
    name: 'Dyson Airwrap Multi-Styler Complete (Long) — Vinca Blue',
    description: 'Styles, waves, curls, and dries simultaneously without extreme heat.',
    price: 44900.00,
    stock_qty: 30,
    rating: 4.75,
    review_count: 3421,
    images: [
      { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── GROCERY ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'grocery',
    name: 'Quaker Oats — 2kg',
    description: '100% whole grain oats. No added sugar or salt. A heart-healthy breakfast choice.',
    price: 329.00,
    stock_qty: 600,
    rating: 4.45,
    review_count: 21000,
    images: [
      { url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'grocery',
    name: 'Tata Salt Lite (Low Sodium) — 1kg',
    description: 'Tata Salt Lite has 15% less sodium than regular salt.',
    price: 32.00,
    stock_qty: 1000,
    rating: 4.10,
    review_count: 43210,
    images: [
      { url: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── AUTOMOTIVE ──────────────────────────────────────────────────────────────
  {
    categorySlug: 'automotive',
    name: 'Michelin Pilot Sport 4 Tyre — 205/55 R16 91V',
    description: 'Ultra-high performance summer tyre. Dynamic Response Technology for precise steering.',
    price: 8990.00,
    stock_qty: 55,
    rating: 4.70,
    review_count: 1234,
    images: [
      { url: 'https://images.unsplash.com/photo-1600705722908-bab1e61c0b4f?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── GARDEN ──────────────────────────────────────────────────────────────────
  {
    categorySlug: 'garden',
    name: 'Ugaoo Garden Tool Set — 5 Piece Stainless Steel',
    description: 'Set includes trowel, transplanter, cultivator, weeder, and hand fork.',
    price: 799.00,
    stock_qty: 120,
    rating: 4.30,
    review_count: 2341,
    images: [
      { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },

  // ── ELECTRONICS (parent category directly) ──────────────────────────────────
  {
    categorySlug: 'electronics',
    name: 'Samsung 55" Crystal 4K UHD Smart TV (UA55CU7700)',
    description: 'Crystal Processor 4K upscales all your content to stunning 4K quality.',
    price: 52990.00,
    stock_qty: 18,
    rating: 4.60,
    review_count: 3456,
    images: [
      { url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
  {
    categorySlug: 'electronics',
    name: 'Amazon Echo Dot (5th Gen) Smart Speaker — Charcoal',
    description: 'Our best-sounding Echo Dot yet. Bigger vocals, deeper bass.',
    price: 4499.00,
    stock_qty: 200,
    rating: 4.55,
    review_count: 12345,
    images: [
      { url: 'https://images.unsplash.com/photo-1512446816042-444d641267d4?w=800&q=80', is_primary: true, display_order: 1 },
    ],
  },
];`;

const startIndex = seedContent.indexOf('const productData = [');
const endIndex = seedContent.indexOf('];\n\n// ─── MAIN SEED FUNCTION ────────────────────────────────────────────────────────');

if (startIndex > -1 && endIndex > -1) {
  const newContent = seedContent.slice(0, startIndex) + newProductData + seedContent.slice(endIndex + 2);
  fs.writeFileSync(seedPath, newContent);
  console.log('Seed updated successfully!');
} else {
  console.log('Could not find productData block.');
}
