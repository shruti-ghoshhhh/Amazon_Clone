// Home.jsx — Amazon Clone Homepage
//
// Sections (top to bottom):
//   1. HeroCarousel — full-width rotating banner
//   2. Category Cards — 4-column grid (overlaps carousel bottom)
//   3. Deals Strip — dark promotional banner
//   4. Product rows — by category (Electronics, Books, Sports, etc.)
//
// Data strategy:
//   - Categories are fetched once and mapped to cards with curated images
//   - Products are fetched per-section in parallel using Promise.all
//   - Skeleton loading shown while data loads

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../../components/HeroCarousel/HeroCarousel.jsx';
import ProductCard  from '../../components/ProductCard/ProductCard.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import api from '../../services/api.js';
import './Home.css';

// Category → curated Unsplash image + slug mapping
const CATEGORY_IMAGES = {
  'electronics':    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',
  'clothing':       'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
  'books':          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
  'home-kitchen':   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
  'sports-outdoors':'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  'toys-games':     'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80',
  'beauty':         'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
  'grocery':        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
  'automotive':     'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
  'garden':         'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
};

// Product sections to show on homepage — each maps to a category slug
const PRODUCT_SECTIONS = [
  { title: 'Top Electronics',        slug: 'electronics',     sort: 'rating'   },
  { title: 'Bestselling Books',       slug: 'books',           sort: 'rating'   },
  { title: 'Sports & Fitness Gear',   slug: 'sports-outdoors', sort: 'rating'   },
  { title: 'Home & Kitchen Picks',    slug: 'home-kitchen',    sort: 'newest'   },
];

// Skeleton placeholder while loading
function SkeletonRow() {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-title-sm" />
          <div className="skeleton skeleton-price" />
        </div>
      ))}
    </div>
  );
}

// A single horizontal product section row
function ProductSection({ title, slug, sort }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products', { params: { category: slug, sort, limit: 5 } })
      .then(({ data }) => setProducts(data.data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, sort]);

  return (
    <section className="home-section" aria-label={title}>
      <div className="home-section__header">
        <h2 className="home-section__title">{title}</h2>
        <Link to={`/products?category=${slug}`} className="home-section__see-all">
          See all →
        </Link>
      </div>

      {loading ? (
        <SkeletonRow />
      ) : products.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No products found.</p>
      ) : (
        <div className="home-product-row">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main Home component ────────────────────────────────────────
export default function Home() {
  const [categories, setCategories] = useState([]);
  const { wishlist } = useWishlist();
  const [listDeals, setListDeals] = useState([]);
  const [listDealsLoading, setListDealsLoading] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = 'Amazon.in: Online Shopping — India';

    api.get('/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  // Dynamically load deals based on user's lists (wishlist categories)
  useEffect(() => {
    let active = true;
    const fetchListDeals = async () => {
      setListDealsLoading(true);
      try {
        let categorySlug = '';
        if (wishlist && wishlist.length > 0) {
          // Extract category slug from the user's wishlisted items
          const firstWithCat = wishlist.find(item => item.product?.category?.slug || item.product?.category);
          if (firstWithCat) {
            categorySlug = firstWithCat.product.category?.slug || firstWithCat.product.category;
          }
        }
        
        // Fallback to 'electronics' if wishlist is empty or category is unresolved
        if (!categorySlug) {
          categorySlug = 'electronics';
        }

        const { data } = await api.get('/products', { params: { category: categorySlug, limit: 4 } });
        if (active) {
          const products = data.data?.products || [];
          const discounts = [86, 40, 35, 48];
          
          if (products.length === 0) {
            // Ultimate fallback to generic products
            const fallbackRes = await api.get('/products', { params: { limit: 4 } });
            const fallbackProducts = fallbackRes.data?.data?.products || [];
            setListDeals(fallbackProducts.map((p, i) => ({
              ...p,
              discount: discounts[i % discounts.length]
            })));
          } else {
            setListDeals(products.slice(0, 4).map((p, i) => ({
              ...p,
              discount: discounts[i % discounts.length]
            })));
          }
        }
      } catch (err) {
        console.error('❌ [Home Overlay] Failed to load list deals:', err);
      } finally {
        if (active) setListDealsLoading(false);
      }
    };

    fetchListDeals();
    return () => { active = false; };
  }, [wishlist]);

  return (
    <div style={{ background: 'var(--color-page-bg, #eaeded)', minHeight: '100vh' }}>
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Premium Multi-Panel Grid Overlay Container */}
      <div className="home-overlay-grid">
        
        {/* Panel 1: Min. 50% Off Denim vacation fest */}
        <div className="home-overlay-card">
          <h3 className="home-overlay-card__title">Vacation wear fest | Min. 50% off</h3>
          <div className="home-overlay-card__grid-2x2">
            <Link to="/products?category=clothing" className="home-overlay-card__grid-item">
              <img src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=200&q=80" alt="Levi's Denim" />
              <span>Levi's Jackets</span>
            </Link>
            <Link to="/products?category=clothing" className="home-overlay-card__grid-item">
              <img src="https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=200&q=80" alt="ONLY Tops" />
              <span>ONLY Tops</span>
            </Link>
            <Link to="/products?category=clothing" className="home-overlay-card__grid-item">
              <img src="https://images.unsplash.com/photo-1554568218-0f1715e72254?w=200&q=80" alt="Classic Shirts" />
              <span>Shirts & Tees</span>
            </Link>
            <Link to="/products?category=clothing" className="home-overlay-card__grid-item">
              <img src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&q=80" alt="Premium Jeans" />
              <span>Premium Jeans</span>
            </Link>
          </div>
          <Link to="/products?category=clothing" className="home-overlay-card__see-all">Shop Denim Fest</Link>
        </div>

        {/* Panel 2: Coming Soon - REDMI Turbo 5 banner */}
        <div className="home-overlay-card redmi-promo-card">
          <h3 className="home-overlay-card__title">REDMI Turbo 5</h3>
          <div className="redmi-promo-card__visual">
            <img src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80" alt="REDMI Turbo 5" className="redmi-promo-card__img" />
            <div className="redmi-promo-card__badge">Coming Soon</div>
          </div>
          <p className="redmi-promo-card__tagline">Engineered for precision, tuned for clarity.</p>
          <button 
            onClick={() => alert('Thanks for your interest! We have registered your request. You will be notified as soon as REDMI Turbo 5 goes live.')} 
            className="redmi-promo-card__notify-btn"
          >
            Notify me
          </button>
        </div>

        {/* Panel 3: Deals based on your lists */}
        <div className="home-overlay-card deals-list-card">
          <h3 className="home-overlay-card__title">Deals based on your lists</h3>
          
          {listDealsLoading ? (
            <div className="home-overlay-card__loading">
              <div className="spinner-sm" />
            </div>
          ) : listDeals && listDeals.length > 0 ? (
            <div className="home-overlay-card__grid-2x2">
              {listDeals.map(product => {
                const primaryImage = product.images?.[0]?.url || 'https://via.placeholder.com/150';
                return (
                  <Link key={product.id} to={`/products/${product.id}`} className="home-overlay-card__deal-item">
                    <div className="home-overlay-card__deal-img-wrap">
                      <img src={primaryImage} alt={product.name} />
                    </div>
                    <span className="home-overlay-card__deal-pill">{product.discount || 40}% off</span>
                    <span className="home-overlay-card__deal-name">{product.name}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="home-overlay-card__empty">
              <p>Explore hot deals today.</p>
              <Link to="/products" className="home-overlay-card__see-all">Explore deals</Link>
            </div>
          )}
          <Link to="/wishlist" className="home-overlay-card__see-all">View Your Wish List</Link>
        </div>

        {/* Panel 4: Just for Prime credit card promo */}
        <div className="home-overlay-card prime-cc-card">
          <div className="prime-cc-card__header">
            <h3 className="home-overlay-card__title">Just for Prime</h3>
            <span className="prime-tag">prime</span>
          </div>
          <div className="prime-cc-card__visual">
            <img src="https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=400&q=80" alt="Amazon Pay Credit Card" className="prime-cc-card__img" />
            <div className="prime-cc-card__glass-glow" />
            <div className="prime-cc-card__text-overlay">
              <div className="cc-text-top">Amazon Pay</div>
              <div className="cc-text-mid">5% Cashback</div>
              <div className="cc-text-bot">Unlimited Rewards</div>
            </div>
          </div>
          <div className="prime-cc-card__body">
            <p className="prime-cc-card__desc">Unlimited 5% cashback* on Amazon Pay ICICI Bank credit card.</p>
            <Link to="/checkout" className="prime-cc-card__cta">Apply now in 60 seconds</Link>
          </div>
        </div>

      </div>

      {/* 2.5 Category Circular Pills Strip */}
      <div className="category-pills-bar">
        <h4 className="category-pills-bar__title">Shop by Category</h4>
        <div className="category-pills-bar__scroll">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="category-pill"
              aria-label={`Shop ${cat.name}`}
            >
              <div className="category-pill__circle">
                <img
                  src={CATEGORY_IMAGES[cat.slug] || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&q=80'}
                  alt={cat.name}
                  className="category-pill__img"
                  loading="lazy"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&q=80'; }}
                />
              </div>
              <span className="category-pill__label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Deals Banner Strip */}
      <div className="home-section" style={{ marginBottom: 32 }}>
        <div className="deals-strip">
          <div className="deals-strip__text">
            <h2>Today's Deals</h2>
            <p>New deals added every day. Limited time offers across all categories.</p>
          </div>
          <Link to="/products?sort=rating" className="deals-strip__cta">
            Shop All Deals
          </Link>
        </div>
      </div>

      {/* 4. Product sections — one per category */}
      {PRODUCT_SECTIONS.map(section => (
        <ProductSection key={section.slug} {...section} />
      ))}

      {/* 5. Bottom promo — "More to explore" */}
      <section className="home-section" aria-label="More categories">
        <div className="home-section__header">
          <h2 className="home-section__title">More to Explore</h2>
        </div>
        <div className="home-categories">
          {categories.slice(4, 8).map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="category-card"
              aria-label={`Shop ${cat.name}`}
            >
              <img
                src={CATEGORY_IMAGES[cat.slug] || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80'}
                alt={cat.name}
                className="category-card__img"
                loading="lazy"
              />
              <div className="category-card__body">
                <p className="category-card__name">{cat.name}</p>
                <p className="category-card__see-more">See more</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* spacer before footer */}
      <div style={{ height: 40 }} />
    </div>
  );
}
