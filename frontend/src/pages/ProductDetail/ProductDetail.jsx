// ProductDetail.jsx — Product detail page
//
// Layout: 3-column grid (sticky image gallery | product info | sticky buy box)
//
// Key concepts demonstrated:
//
//   useParams()      → reads :id from the URL /products/:id
//   useState         → manages active image, quantity, button feedback
//   useEffect        → fetches product on mount + "also viewed" products
//   useCart()        → calls addToCart from CartContext
//   useNavigate()    → sends user to /cart after "Buy Now"
//
// The Buy Box:
//   - Quantity dropdown (1–10)
//   - Add to Cart → shows "Added to Cart ✓" for 2s, updates navbar badge
//   - Buy Now → addToCart + immediately navigate to /cart

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import StarRating  from '../../components/StarRating/StarRating.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import api from '../../services/api.js';
import './ProductDetail.css';

// Format Indian price: 134900 → "1,34,900"
const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// Calculate delivery date string
const getDeliveryString = (daysAhead) => {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() + daysAhead);
  const dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  if (daysAhead === 0) return `Today, ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`;
  if (daysAhead === 1) return `Tomorrow, ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`;
  return dateStr;
};

// Calculate MRP — consistent with ProductCard's formula (15-60% off)
const getMRP = (price) => {
  const p = parseFloat(price);
  const discountPct = 15 + (Math.floor(p) % 45);
  const mrp = Math.round(p / (1 - discountPct / 100));
  const savings = mrp - Math.round(p);
  return { mrp, discountPct, savings };
};

// Get "bought in past month" count from review_count
const getBoughtCount = (reviewCount) => {
  if (!reviewCount || reviewCount < 5) return null;
  const count = Math.floor(reviewCount * 4.8);
  if (count < 50) return null;
  const rounded = Math.round(count / 50) * 50;
  return `${rounded.toLocaleString('en-IN')}+`;
};

// Split description into bullet points on ". " or "\n"
const toBullets = (desc = '') => {
  const bullets = desc.split(/\. |\n/).filter(s => s.trim().length > 10);
  return bullets.length > 1 ? bullets : [desc];
};

// ── Skeleton while loading ─────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="detail-skeleton">
      <div className="skeleton skel-gallery" style={{ borderRadius: 4 }} />
      <div>
        <div className="skeleton skel-line skel-title" />
        <div className="skeleton skel-line" style={{ width: '60%' }} />
        <div className="skeleton skel-line" style={{ width: '40%' }} />
        <div className="skeleton skel-line skel-price" />
        <div className="skeleton skel-line" style={{ width: '70%' }} />
        <div className="skeleton skel-line" style={{ width: '80%' }} />
        <div className="skeleton skel-line" style={{ width: '55%' }} />
      </div>
      <div className="skeleton" style={{ height: 300, borderRadius: 8 }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ProductDetail() {
  const { id }    = useParams();     // Extract product UUID from URL
  const navigate  = useNavigate();
  const { addToCart } = useCart();

  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [activeImg,    setActiveImg]    = useState(0);  // Index of shown image
  const [quantity,     setQuantity]     = useState(1);
  const [addStatus,    setAddStatus]    = useState('idle');
  const [wishStatus,   setWishStatus]   = useState('idle');
  const [alsoViewed,   setAlsoViewed]   = useState([]);

  // Zoom lens state — tracks mouse position over main image
  const [zoomPos,     setZoomPos]     = useState({ x: 0, y: 0 });   // 0-1 normalized
  const [zoomActive,  setZoomActive]  = useState(false);
  const imgWrapRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    setActiveImg(0);
    setQuantity(1);
    setAddStatus('idle');

    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.data);
        document.title = `${data.data.name} — Amazon Clone`;

        // Fetch "customers also viewed" — same category, excluding this product
        const catSlug = data.data.category?.slug;
        if (catSlug) {
          api.get('/products', { params: { category: catSlug, limit: 6 } })
            .then(r => setAlsoViewed(
              r.data.data.products.filter(p => p.id !== id).slice(0, 5)
            ))
            .catch(() => {});
        }
      })
      .catch(() => setError('Product not found or unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Add to Cart handler ───────────────────────────────────────
  const handleAddToCart = async () => {
    if (addStatus === 'adding') return;
    setAddStatus('adding');

    const result = await addToCart(product.id, quantity);
    if (result.success) {
      setAddStatus('added');
      setTimeout(() => setAddStatus('idle'), 2000);
    } else {
      setAddStatus('error');
      setTimeout(() => setAddStatus('idle'), 2000);
    }
  };

  // ── Buy Now handler ───────────────────────────────────────────
  const handleBuyNow = async () => {
    await addToCart(product.id, quantity);
    navigate('/cart');
  };

  // ── Add to Wish List handler ──────────────────────────────────
  const handleAddToWishlist = async () => {
    if (wishStatus === 'adding') return;
    setWishStatus('adding');
    try {
      await api.post('/wishlist', { product_id: product.id });
      setWishStatus('added');
      setTimeout(() => setWishStatus('idle'), 2000);
    } catch (err) {
      setWishStatus('error');
      setTimeout(() => setWishStatus('idle'), 2000);
    }
  };

  // Zoom lens mouse move handler
  const handleImgMouseMove = useCallback((e) => {
    if (!imgWrapRef.current) return;
    const rect = imgWrapRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top)  / rect.height));
    setZoomPos({ x, y });
  }, []);

  // ── Loading / Error states ─────────────────────────────────────
  if (loading) return <DetailSkeleton />;

  if (error) return (
    <div className="detail-page">
      <div className="no-results">
        <h2>Product Not Found</h2>
        <p>{error}</p>
        <Link to="/products" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 12 }}>
          ← Back to Products
        </Link>
      </div>
    </div>
  );

  const images  = product.images || [];
  const inStock = product.stock_qty > 0;
  const bullets = toBullets(product.description);
  const maxQty  = Math.min(product.stock_qty, 10);
  const isPrime = !!product.is_prime;
  const deliveryDays = typeof product.delivery_days === 'number' ? product.delivery_days : 2;

  const cartBtnText =
    addStatus === 'adding' ? 'Adding...' :
    addStatus === 'added'  ? '✓ Added to Cart' :
    addStatus === 'error'  ? '✗ Failed — Try Again' :
    'Add to Cart';

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
      <div className="detail-page">

        {/* Breadcrumb */}
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          {product.category?.parent && (
            <>
              <Link to={`/products?category=${product.category.parent.slug}`}>
                {product.category.parent.name}
              </Link>
              <span>›</span>
            </>
          )}
          {product.category && (
            <>
              <Link to={`/products?category=${product.category.slug}`}>
                {product.category.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span style={{ color: 'var(--color-text-primary)' }}>
            {product.name.length > 40 ? product.name.slice(0, 40) + '…' : product.name}
          </span>
        </nav>

        {/* ── 3-column grid ───────────────────────────────────── */}
        <div className="detail-grid">

          {/* ── LEFT: Image Gallery (Amazon-style zoom) ─────── */}
          <div className="detail-gallery">
            <div className="detail-gallery-inner">

              {/* Vertical thumbnail strip on left */}
              {images.length > 1 && (
                <div className="detail-thumbnails">
                  {images.map((img, i) => (
                    <button
                      key={img.id || i}
                      className={`detail-thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => { setActiveImg(i); setZoomActive(false); }}
                      onMouseEnter={() => setActiveImg(i)}
                      aria-label={`View image ${i + 1}`}
                      aria-pressed={i === activeImg}
                    >
                      <img src={img.url} alt={`View ${i + 1}`} loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image + zoom lens overlay */}
              <div className="detail-main-img-outer">
                {/* The main image — mouse events drive the zoom lens */}
                <div
                  className={`detail-main-img-wrap ${zoomActive ? 'zooming' : ''}`}
                  ref={imgWrapRef}
                  aria-label="Product image — hover to zoom"
                  onMouseEnter={() => setZoomActive(true)}
                  onMouseLeave={() => setZoomActive(false)}
                  onMouseMove={handleImgMouseMove}
                >
                  <img
                    src={images[activeImg]?.url || images[0]?.url || 'https://via.placeholder.com/400?text=No+Image'}
                    alt={product.name}
                    className="detail-main-img"
                    loading="eager"
                    draggable={false}
                  />

                  {/* Lens rectangle — follows cursor */}
                  {zoomActive && (
                    <div
                      className="detail-zoom-lens"
                      style={{
                        left: `${zoomPos.x * 100}%`,
                        top:  `${zoomPos.y * 100}%`,
                      }}
                    />
                  )}

                  {!zoomActive && (
                    <span className="zoom-hint">Roll over image to zoom in</span>
                  )}
                </div>

                {/* Zoomed result panel — floats to the right of the gallery column */}
                {zoomActive && (
                  <div
                    className="detail-zoom-result"
                    style={{
                      backgroundImage: `url('${images[activeImg]?.url || images[0]?.url}')`,
                      backgroundSize: '350%',
                      backgroundPositionX: `${zoomPos.x * 100}%`,
                      backgroundPositionY: `${zoomPos.y * 100}%`,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── CENTER: Product Info (matches Amazon.in layout) ─── */}
          <div className="detail-info">

            {/* Brand link — "Visit the X Store" / "Brand: X" */}
            <div className="detail-brand-row">
              <Link
                to={`/products?search=${encodeURIComponent(product.name.split(' ')[0])}`}
                className="detail-brand-link"
              >
                Brand: <span className="detail-brand-name">{product.name.split(/[\s—\-]/)[0]}</span>
              </Link>
            </div>

            {/* Product title — H1 for SEO, regular weight like Amazon */}
            <h1 className="detail-title">{product.name}</h1>

            {/* Rating row: stars + count + divider + "Search this page" */}
            <div className="detail-rating-row">
              <StarRating
                rating={parseFloat(product.rating)}
                count={product.review_count}
                size={15}
                showValue={true}
              />
              <span className="detail-rating-sep">|</span>
              <a href="#customer-reviews" className="detail-search-page-link">
                Search this page
              </a>
            </div>

            {/* "X+ bought in past month" — orange pill badge like Amazon */}
            {(() => {
              const count = getBoughtCount(product.review_count);
              return count ? (
                <div className="detail-bought-row">
                  <span className="detail-bought-pill">{count} bought in past month</span>
                </div>
              ) : null;
            })()}

            <hr className="detail-divider" />

            {/* Price block — "-X% ₹Price" then MRP + You Save */}
            {(() => {
              const { mrp, discountPct, savings } = getMRP(product.price);
              return (
                <div className="detail-price-block">
                  {/* "-86% ₹359" row — discount in red, price next to it */}
                  <div className="detail-price-top-row">
                    <span className="detail-price-discount-pct">-{discountPct}%</span>
                    <div className="detail-price-main">
                      <span className="detail-price-symbol">₹</span>
                      <span className="detail-price-whole">{fmt(product.price)}</span>
                      <sup className="detail-price-paise">00</sup>
                    </div>
                  </div>
                  {/* M.R.P. strikethrough */}
                  <div className="detail-price-mrp">
                    M.R.P.: <s>₹{fmt(mrp)}</s>
                  </div>
                  {/* You Save */}
                  <div className="detail-price-savings">
                    You Save: ₹{fmt(savings)} ({discountPct}%)
                  </div>
                  {/* Inclusive of all taxes */}
                  <div className="detail-price-tax">Inclusive of all taxes</div>
                </div>
              );
            })()}

            {/* Prime + FREE delivery */}
            {isPrime ? (
              <div className="detail-prime-row">
                <svg viewBox="0 0 54 15" className="detail-prime-svg" aria-label="prime">
                  <text x="1" y="12" fontFamily="Arial" fontWeight="bold" fontStyle="italic" fontSize="13" fill="#00A8E0">prime</text>
                </svg>
                <span className="detail-delivery-text">
                  <strong>FREE</strong> delivery{' '}
                  <strong>{getDeliveryString(deliveryDays)}</strong>
                </span>
              </div>
            ) : (
              <div className="detail-prime-row">
                <span className="detail-delivery-text">
                  FREE delivery <strong>{getDeliveryString(deliveryDays + 1)}</strong>
                </span>
              </div>
            )}

            {/* Or fastest delivery */}
            {deliveryDays > 0 && (
              <div className="detail-fastest-row">
                Or fastest delivery <strong>{getDeliveryString(deliveryDays - 1)}</strong>. Order within 4 hrs.
              </div>
            )}

            <hr className="detail-divider" />

            {/* Stock status */}
            <div className={`detail-stock ${inStock ? 'in-stock' : 'out-stock'}`}>
              {inStock ? 'In Stock' : 'Currently unavailable'}
            </div>
            {inStock && product.stock_qty < 10 && (
              <div className="detail-low-stock">
                Only {product.stock_qty} left in stock — order soon.
              </div>
            )}

            {/* About this item */}
            <div className="detail-about">
              <h3>About this item</h3>
              <ul>
                {bullets.map((b, i) => (
                  <li key={i}>{b.trim()}</li>
                ))}
              </ul>
            </div>

            {/* Product Information table */}
            <hr className="detail-divider" />
            <div id="customer-reviews">
              <h3 className="detail-section-h3">Product Information</h3>
              <table className="detail-info-table">
                <tbody>
                  {[
                    ['Brand',        product.name.split(' ')[0]],
                    ['Category',     product.category?.name || 'N/A'],
                    ['Rating',       `${product.rating} out of 5`],
                    ['Reviews',      (product.review_count || 0).toLocaleString('en-IN') + ' ratings'],
                    ['Availability', inStock ? `In Stock` : 'Out of Stock'],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="detail-info-td-label">{label}</td>
                      <td className="detail-info-td-value">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── RIGHT: Buy Box (Amazon.in faithful) ─────────── */}
          <div className="detail-buybox">

            {/* Price + prime logo */}
            {(() => {
              const { mrp, discountPct } = getMRP(product.price);
              return (
                <>
                  {/* Prime logo above price */}
                  {isPrime && (
                    <div className="buybox-prime-logo-row">
                      <svg viewBox="0 0 54 15" className="buybox-prime-svg" aria-label="prime">
                        <text x="1" y="12" fontFamily="Arial" fontWeight="bold" fontStyle="italic" fontSize="13" fill="#00A8E0">prime</text>
                      </svg>
                    </div>
                  )}

                  {/* Large price */}
                  <div className="buybox-price-main">
                    <span className="buybox-price-symbol">₹</span>
                    <span className="buybox-price-whole">{fmt(product.price)}</span>
                    <sup className="buybox-price-paise">00</sup>
                  </div>

                  {/* M.R.P. + discount % */}
                  <div className="buybox-price-mrp">
                    M.R.P: <s>₹{fmt(mrp)}</s>
                    <span className="buybox-price-discount"> ({discountPct}% off)</span>
                  </div>
                </>
              );
            })()}

            {/* FREE delivery */}
            <div className="buybox-delivery">
              <div>
                <strong>FREE</strong> delivery{' '}
                <strong>{getDeliveryString(isPrime ? deliveryDays : deliveryDays + 1)}</strong>
              </div>
              {deliveryDays > 0 && (
                <div className="buybox-fastest">
                  Or fastest delivery <strong>{getDeliveryString(deliveryDays - 1)}</strong>
                </div>
              )}
              <div className="buybox-location">
                <span className="buybox-pin">📍</span>
                Deliver to India
              </div>
            </div>

            {/* Stock status */}
            <div className={`buybox-stock ${!inStock ? 'oos' : ''}`}>
              {inStock ? 'In Stock' : 'Currently Unavailable'}
            </div>

            {/* Qty selector */}
            {inStock && (
              <div className="buybox-qty-row">
                <label htmlFor="buybox-qty">Qty:</label>
                <select
                  id="buybox-qty"
                  className="buybox-qty"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value))}
                >
                  {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Add to Cart */}
            {inStock && (
              <button
                id={`buybox-add-to-cart-${product.id}`}
                className={`buybox-btn-cart ${addStatus === 'added' ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={addStatus === 'adding'}
                aria-label="Add to cart"
              >
                {cartBtnText}
              </button>
            )}

            {/* Buy Now */}
            {inStock && (
              <button
                id={`buybox-buy-now-${product.id}`}
                className="buybox-btn-buy"
                onClick={handleBuyNow}
                aria-label="Buy now"
              >
                Buy Now
              </button>
            )}

            <hr className="detail-divider" />

            {/* Ships from / Sold by / Returns / Payment */}
            <div className="buybox-meta">
              <div className="buybox-meta-row">
                <span className="buybox-meta-label">Ships from</span>
                <span className="buybox-meta-value">Amazon.in</span>
              </div>
              <div className="buybox-meta-row">
                <span className="buybox-meta-label">Sold by</span>
                <span className="buybox-meta-value link">{product.name.split(' ')[0]} Store</span>
              </div>
              <div className="buybox-meta-row">
                <span className="buybox-meta-label">Returns</span>
                <span className="buybox-meta-value link">Eligible for Return &amp; Refund</span>
              </div>
              <div className="buybox-meta-row">
                <span className="buybox-meta-label">Payment</span>
                <span className="buybox-meta-value">Secure transaction</span>
              </div>
            </div>

            {/* Add to Wish List */}
            <button
              className={`buybox-wishlist ${wishStatus === 'added' ? 'added' : ''}`}
              id={`buybox-wishlist-${product.id}`}
              onClick={handleAddToWishlist}
              disabled={wishStatus === 'adding'}
              aria-label="Add to Wish List"
            >
              {wishStatus === 'adding' ? 'Adding...' :
               wishStatus === 'added' ? '✓ Added to Wish List' :
               wishStatus === 'error' ? '✗ Failed to Add' :
               '♡ Add to Wish List'}
            </button>
          </div>

        </div>{/* /detail-grid */}

        {/* ── Customers also viewed ──────────────────────────── */}
        {alsoViewed.length > 0 && (
          <div className="detail-also-viewed">
            <h2>Customers also viewed</h2>
            <div className="detail-also-row">
              {alsoViewed.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>{/* /detail-page */}
    </div>
  );
}
