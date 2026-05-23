// SavedItemCard.jsx — Modular card for a single item in the "Saved for later" tab.
//
// Props:
//   item     — wishlist item object from WishlistContext { product_id, product: { name, price, rating, images, stock_qty } }
//   onMoved  — callback to refresh the wishlist list after moving an item to cart

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const getPrimaryImage = (images = []) => {
  if (!images?.length) return 'https://via.placeholder.com/120?text=?';
  return (images.find(i => i.is_primary) || images[0]).url;
};

function StarRow({ rating }) {
  const r = parseFloat(rating) || 0;
  return (
    <span className="saved-card__stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= r ? '#e47911' : '#ccc', fontSize: 12 }}>★</span>
      ))}
      <span className="saved-card__rating-num"> {r.toFixed(1)}</span>
    </span>
  );
}

export default function SavedItemCard({ item, onMoved }) {
  const { addToCart } = useCart();
  const { removeFromWishlist } = useWishlist();
  const [busy, setBusy] = useState(false);

  const product   = item.product || {};
  const productId = item.product_id;
  const imgUrl    = getPrimaryImage(product.images);
  const inStock   = product.stock_qty > 0;
  const mrp       = (parseFloat(product.price) * 1.6).toFixed(0);
  const disc      = Math.round(((mrp - product.price) / mrp) * 100);

  const handleMoveToCart = async () => {
    setBusy(true);
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(productId);
      onMoved?.();
    } catch (err) {
      console.error('❌ Move to cart failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await removeFromWishlist(productId);
      onMoved?.();
    } catch (err) {
      console.error('❌ Delete failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="saved-card">
      <Link to={`/products/${productId}`} className="saved-card__img-wrap">
        <img
          src={imgUrl}
          alt={product.name}
          className="saved-card__img"
          onError={e => { e.target.src = 'https://via.placeholder.com/120?text=?'; }}
        />
      </Link>

      <div className="saved-card__body">
        <Link to={`/products/${productId}`} className="saved-card__title">
          {product.name}
        </Link>

        <StarRow rating={product.rating} />

        <div className="saved-card__price-row">
          <span className="saved-card__price">₹{fmt(product.price)}</span>
          <span className="saved-card__mrp"><s>₹{fmt(mrp)}</s></span>
          <span className="saved-card__disc">-{disc}%</span>
        </div>

        <span className={`saved-card__stock ${!inStock ? 'out' : ''}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>

        <div className="saved-card__actions">
          <button
            className="saved-card__move-btn"
            onClick={handleMoveToCart}
            disabled={busy || !inStock}
          >
            {busy ? 'Moving…' : 'Move to Cart'}
          </button>
          <button
            className="saved-card__del-btn"
            onClick={handleDelete}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
