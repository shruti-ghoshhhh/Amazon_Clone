// ProductListing.jsx — Amazon.in faithful search results & category browse page
//
// Layout matches Amazon exactly:
//   LEFT SIDEBAR:
//     Department (category list with active bullet)
//     Amazon Prime (checkbox)
//     Delivery Day (Get It Today / Tomorrow / 2 Days)
//     Avg. Customer Review (star rows)
//     Price (min–max range input + Go)
//
//   MAIN CONTENT:
//     "Results" heading + subtitle text
//     Breadcrumb (category > current)
//     Results count + Sort by dropdown (right-aligned)
//     Product grid (4 cols → 3 → 2 on smaller screens)
//     Pagination

import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import api from '../../services/api.js';
import './ProductListing.css';

const LIMIT = 16;

// ── Skeleton card placeholder ──────────────────────────────────
function SkeletonCard() {
  return (
    <div className="pl-skeleton-card">
      <div className="skeleton pl-skeleton-img" />
      <div className="skeleton pl-skeleton-brand" />
      <div className="skeleton pl-skeleton-title" />
      <div className="skeleton pl-skeleton-title-sm" />
      <div className="skeleton pl-skeleton-price" />
      <div className="skeleton pl-skeleton-btn" />
    </div>
  );
}

// ── Pagination component ───────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNums = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('…');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="pl-pagination" role="navigation" aria-label="Pagination">
      <button
        className="pl-page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >← Previous</button>

      {getPageNums().map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="pl-page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`pl-page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            id={`page-btn-${p}`}
          >{p}</button>
        )
      )}

      <button
        className="pl-page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >Next →</button>
    </div>
  );
}

// ── Main ProductListing component ─────────────────────────────
export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL is the single source of truth for all filters
  const search        = searchParams.get('search')   || '';
  const category      = searchParams.get('category') || '';
  const sort          = searchParams.get('sort')     || 'newest';
  const page          = parseInt(searchParams.get('page') || '1');
  const minRating     = parseInt(searchParams.get('rating') || '0');
  const primeOnly     = searchParams.get('prime') === '1';
  const delivDay      = searchParams.get('delivery') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';

  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [categories, setCategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Local price inputs (synchronized with URL params)
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Fetch categories for sidebar once on mount
  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  // Sync local input fields when URL params change
  useEffect(() => {
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Fetch products whenever URL params change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const params = { limit: LIMIT, page, sort };
      if (search)         params.search   = search;
      if (category)       params.category = category;
      if (minRating)      params.rating   = minRating;
      if (primeOnly)      params.prime    = '1';
      if (delivDay)       params.delivery = delivDay;
      if (minPriceParam)  params.minPrice = minPriceParam;
      if (maxPriceParam)  params.maxPrice = maxPriceParam;

      const { data } = await api.get('/products', { params });
      setProducts(data.data.products);
      setTotal(data.data.total);
      setTotalPages(data.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, page, minRating, primeOnly, delivDay, minPriceParam, maxPriceParam]);

  useEffect(() => {
    document.title = search
      ? `Amazon.in : "${search}"`
      : `${category || 'All'} Products — Amazon Clone`;
    fetchProducts();
  }, [fetchProducts, search, category]);

  // ── URL helpers ────────────────────────────────────────────
  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSort     = (e) => updateParam('sort', e.target.value);
  const handleRating   = (r) => updateParam('rating', r === minRating ? '' : r);
  const handlePrime    = () => updateParam('prime', primeOnly ? '' : '1');
  const handleDelivery = (d) => updateParam('delivery', d === delivDay ? '' : d);

  const handleCategory = (slug) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('category', slug); else next.delete('category');
    next.delete('page');
    setSearchParams(next);
    setSidebarOpen(false);
  };

  const handlePageChange = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
  };

  const handlePriceGo = () => {
    const next = new URLSearchParams(searchParams);
    if (minPrice) next.set('minPrice', minPrice); else next.delete('minPrice');
    if (maxPrice) next.set('maxPrice', maxPrice); else next.delete('maxPrice');
    next.delete('page');
    setSearchParams(next);
  };

  const handlePriceQuickSelect = (min, max) => {
    const next = new URLSearchParams(searchParams);
    if (min !== null) {
      next.set('minPrice', min);
      setMinPrice(min);
    } else {
      next.delete('minPrice');
      setMinPrice('');
    }
    if (max !== null) {
      next.set('maxPrice', max);
      setMaxPrice(max);
    } else {
      next.delete('maxPrice');
      setMaxPrice('');
    }
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    navigate('/products');
  };

  const hasFilters = search || category || minRating || primeOnly || delivDay;

  // ── Active category label ──────────────────────────────────
  let currentCategory = null;
  let parentCategory = null;
  for (const parent of categories) {
    if (parent.slug === category) {
      currentCategory = parent;
      break;
    }
    const sub = parent.subcategories?.find(s => s.slug === category);
    if (sub) {
      currentCategory = sub;
      parentCategory = parent;
      break;
    }
  }

  return (
    <div className="pl-page-bg">

      {/* Mobile filter toggle button */}
      <div className="pl-mobile-filter-row">
        <button
          className="pl-mobile-filter-btn"
          onClick={() => setSidebarOpen(o => !o)}
          aria-expanded={sidebarOpen}
        >
          ☰ Filters {hasFilters ? '(active)' : ''}
        </button>
      </div>

      <div className="pl-layout">

        {/* ═══════════════════════════════════════════════════
            LEFT SIDEBAR — Amazon.in faithful filter panel
            ═══════════════════════════════════════════════════ */}
        <aside className={`pl-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Product filters">

          {/* Breadcrumb / current category above dept list */}
          {currentCategory && (
            <div className="pl-sidebar-breadcrumb">
              <Link to="/products" onClick={() => handleCategory('')} className="pl-sidebar-bc-link">
                All Departments
              </Link>
              <span className="pl-sidebar-bc-sep"> › </span>
              <strong>{currentCategory.name}</strong>
            </div>
          )}

          {/* ── Department section ──────────────────────────── */}
          <div className="pl-sidebar-section">
            <h3 className="pl-sidebar-h3">Department</h3>
            {category && currentCategory ? (
              <>
                <a
                  className="pl-dept-link pl-dept-up"
                  href="#"
                  onClick={e => { e.preventDefault(); handleCategory(''); }}
                >
                  ‹ All Departments
                </a>

                {parentCategory ? (
                  <>
                    <a
                      className="pl-dept-link pl-dept-up"
                      style={{ paddingLeft: '10px' }}
                      href="#"
                      onClick={e => { e.preventDefault(); handleCategory(parentCategory.slug); }}
                    >
                      ‹ {parentCategory.name}
                    </a>

                    {parentCategory.subcategories?.map(sub => (
                      <a
                        key={sub.id}
                        className={`pl-dept-link ${category === sub.slug ? 'active' : ''}`}
                        style={{ paddingLeft: '20px' }}
                        href="#"
                        onClick={e => { e.preventDefault(); handleCategory(sub.slug); }}
                        aria-current={category === sub.slug ? 'page' : undefined}
                      >
                        {category === sub.slug && <span className="pl-dept-bullet">▸ </span>}
                        {sub.name}
                      </a>
                    ))}
                  </>
                ) : (
                  <>
                    <span className="pl-dept-link active" style={{ fontWeight: 'bold', paddingLeft: '10px' }}>
                      {currentCategory.name}
                    </span>

                    {currentCategory.subcategories?.map(sub => (
                      <a
                        key={sub.id}
                        className="pl-dept-link"
                        style={{ paddingLeft: '20px' }}
                        href="#"
                        onClick={e => { e.preventDefault(); handleCategory(sub.slug); }}
                      >
                        {sub.name}
                      </a>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                <a
                  className={`pl-dept-link ${!category ? 'active' : ''}`}
                  href="#"
                  onClick={e => { e.preventDefault(); handleCategory(''); }}
                >
                  All Departments
                </a>
                {categories.map(cat => (
                  <a
                    key={cat.id}
                    className={`pl-dept-link ${category === cat.slug ? 'active' : ''}`}
                    style={{ paddingLeft: '10px' }}
                    href="#"
                    onClick={e => { e.preventDefault(); handleCategory(cat.slug); }}
                  >
                    {cat.name}
                  </a>
                ))}
              </>
            )}
          </div>

          {/* ── Amazon Prime filter ─────────────────────────── */}
          <div className="pl-sidebar-section">
            <h3 className="pl-sidebar-h3">Amazon Prime</h3>
            <label className="pl-prime-label" htmlFor="prime-filter">
              <input
                id="prime-filter"
                type="checkbox"
                checked={primeOnly}
                onChange={handlePrime}
                className="pl-prime-checkbox"
              />
              <span className="pl-prime-logo-text">
                <svg viewBox="0 0 54 15" className="pl-prime-svg" aria-label="prime">
                  <text x="1" y="12" fontFamily="Arial" fontWeight="bold" fontStyle="italic" fontSize="13" fill="#00A8E0">prime</text>
                </svg>
              </span>
            </label>
          </div>

          {/* ── Delivery Day filter ─────────────────────────── */}
          <div className="pl-sidebar-section">
            <h3 className="pl-sidebar-h3">Delivery Day</h3>
            {[
              { key: 'today',    label: 'Get It Today' },
              { key: 'tomorrow', label: 'Get It by Tomorrow' },
              { key: '2days',    label: 'Get It in 2 Days' },
            ].map(({ key, label }) => (
              <label key={key} className="pl-delivery-label">
                <input
                  type="checkbox"
                  checked={delivDay === key}
                  onChange={() => handleDelivery(key)}
                  className="pl-delivery-checkbox"
                />
                <span className="pl-delivery-text">{label}</span>
              </label>
            ))}
          </div>

          {/* ── Average Customer Review ─────────────────────── */}
          <div className="pl-sidebar-section">
            <h3 className="pl-sidebar-h3">Avg. Customer Review</h3>
            {[4, 3, 2, 1].map(r => (
              <a
                key={r}
                className={`pl-star-row ${minRating === r ? 'active' : ''}`}
                href="#"
                onClick={e => { e.preventDefault(); handleRating(r); }}
                aria-pressed={minRating === r}
              >
                {/* Filled + empty stars */}
                <span className="pl-stars">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="13" height="13" viewBox="0 0 24 24" className={`pl-star-svg ${s <= r ? 'filled' : 'empty'}`}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  ))}
                </span>
                <span className="pl-star-up">& Up</span>
              </a>
            ))}
          </div>

          {/* ── Price range filter ──────────────────────────── */}
          <div className="pl-sidebar-section">
            <h3 className="pl-sidebar-h3">Price</h3>
            
            {/* Visual range description */}
            <div className="pl-price-range-info">
              {minPrice || maxPrice ? (
                <>
                  Range: <strong>₹{parseFloat(minPrice || 0).toLocaleString('en-IN')}</strong> - <strong>₹{parseFloat(maxPrice || 200000).toLocaleString('en-IN')}</strong>
                </>
              ) : (
                <span>All prices</span>
              )}
            </div>

            {/* Premium slider for Max Price */}
            <div className="pl-price-slider-wrap">
              <input
                type="range"
                min="0"
                max="200000"
                step="2000"
                value={maxPrice || 200000}
                onChange={e => setMaxPrice(e.target.value)}
                onMouseUp={handlePriceGo}
                onTouchEnd={handlePriceGo}
                className="pl-price-slider"
                aria-label="Max Price Slider"
              />
              <div className="pl-price-slider-labels">
                <span>₹0</span>
                <span>₹2,00,000+</span>
              </div>
            </div>

            {/* Quick Links (faithful to Amazon UI) */}
            <div className="pl-price-quick-links">
              <a href="#" onClick={e => { e.preventDefault(); handlePriceQuickSelect(null, 1000); }}>Under ₹1,000</a>
              <a href="#" onClick={e => { e.preventDefault(); handlePriceQuickSelect(1000, 10000); }}>₹1,000 - ₹10,000</a>
              <a href="#" onClick={e => { e.preventDefault(); handlePriceQuickSelect(10000, 50000); }}>₹10,000 - ₹50,000</a>
              <a href="#" onClick={e => { e.preventDefault(); handlePriceQuickSelect(50000, 100000); }}>₹50,000 - ₹1,00,000</a>
              <a href="#" onClick={e => { e.preventDefault(); handlePriceQuickSelect(100000, null); }}>Over ₹1,00,000</a>
            </div>

            {/* Custom Input Fields */}
            <div className="pl-price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                aria-label="Minimum price"
                min="0"
                className="pl-price-input"
              />
              <span className="pl-price-dash">–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                aria-label="Maximum price"
                min="0"
                className="pl-price-input"
              />
              <button className="pl-price-go" onClick={handlePriceGo}>Go</button>
            </div>
          </div>

          {/* ── Clear all filters ───────────────────────────── */}
          {hasFilters && (
            <button className="pl-clear-btn" onClick={clearFilters}>
              ✕ Clear all filters
            </button>
          )}
        </aside>

        {/* ═══════════════════════════════════════════════════
            MAIN RESULTS AREA
            ═══════════════════════════════════════════════════ */}
        <main className="pl-main">

          {/* Results heading + subtitle — Amazon.in style */}
          <div className="pl-results-header-block">
            {currentCategory && (
              <div className="pl-breadcrumb-bar">
                <Link to="/products" onClick={() => handleCategory('')} className="pl-bc-link">
                  All Departments
                </Link>
                {parentCategory && (
                  <>
                    <span className="pl-bc-sep"> › </span>
                    <Link to={`/products?category=${parentCategory.slug}`} onClick={() => handleCategory(parentCategory.slug)} className="pl-bc-link">
                      {parentCategory.name}
                    </Link>
                  </>
                )}
                <span className="pl-bc-sep"> › </span>
                <span className="pl-bc-current">{currentCategory.name}</span>
              </div>
            )}
            <h1 className="pl-results-heading">Results</h1>
            <p className="pl-results-subtitle">
              Check each product page for other buying options. Price and other details may vary based on product size and colour.
            </p>
          </div>

          {/* Results count + Sort — right-aligned just like Amazon */}
          <div className="pl-results-bar">
            <div className="pl-results-count">
              {loading ? (
                <span className="pl-results-searching">Searching…</span>
              ) : (
                <>
                  {total === 0
                    ? 'No results'
                    : `1–${Math.min(LIMIT * page, total)} of ${total.toLocaleString('en-IN')} result${total !== 1 ? 's' : ''}`}
                  {search && <> for <strong className="pl-results-query">"{search}"</strong></>}
                </>
              )}
            </div>
            <div className="pl-sort-wrap">
              <label htmlFor="sort-select" className="pl-sort-label">Sort by:</label>
              <select
                id="sort-select"
                className="pl-sort-select"
                value={sort}
                onChange={handleSort}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div className="pl-active-filters">
              {search && (
                <span className="pl-filter-pill">
                  Search: "{search}"
                  <button onClick={() => updateParam('search', '')} aria-label="Remove search filter">✕</button>
                </span>
              )}
              {category && (
                <span className="pl-filter-pill">
                  {currentCategory?.name || category}
                  <button onClick={() => handleCategory('')} aria-label="Remove category filter">✕</button>
                </span>
              )}
              {minRating > 0 && (
                <span className="pl-filter-pill">
                  {'★'.repeat(minRating)} & Up
                  <button onClick={() => updateParam('rating', '')} aria-label="Remove rating filter">✕</button>
                </span>
              )}
              {primeOnly && (
                <span className="pl-filter-pill">
                  Prime
                  <button onClick={() => updateParam('prime', '')} aria-label="Remove Prime filter">✕</button>
                </span>
              )}
            </div>
          )}

          {/* ── Product grid / skeletons / empty state ──────── */}
          {loading ? (
            <div className="pl-grid">
              {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="pl-no-results">
              <h2>No results found</h2>
              <p>
                {search
                  ? `We couldn't find anything matching "${search}". Try different keywords or browse by category.`
                  : 'No products in this category yet.'}
              </p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Browse all products
              </button>
            </div>
          ) : (
            <>
              <div className="pl-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
