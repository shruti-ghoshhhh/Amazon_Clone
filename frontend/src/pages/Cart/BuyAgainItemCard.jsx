// BuyAgainItemCard.jsx — Modular card for a single item in the "Buy it again" tab.
//
// Props:
//   item — { id, name, price, rating, images, is_prime } — product object
//          (extracted from past orders, de-duplicated by productId)

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const getPrimaryImage = (images = []) => {
  if (!images?.length) return 'https://via.placeholder.com/120?text=?';
  return (images.find(i => i.is_primary) || images[0]).url;
};

export default function BuyAgainItemCard({ item }) {
  const { addToCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const imgUrl = getPrimaryImage(item.images);
  const mrp    = (parseFloat(item.price) * 1.6).toFixed(0);
  const disc   = Math.round(((mrp - item.price) / mrp) * 100);

  const handleAddToCart = async () => {
    setBusy(true);
    try {
      await addToCart(item.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('❌ Add to cart failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="buy-again-card">
      <Link to={`/products/${item.id}`} className="buy-again-card__img-wrap">
        <img
          src={imgUrl}
          alt={item.name}
          className="buy-again-card__img"
          onError={e => { e.target.src = 'https://via.placeholder.com/120?text=?'; }}
        />
      </Link>

      <div className="buy-again-card__body">
        <Link to={`/products/${item.id}`} className="buy-again-card__title">
          {item.name}
        </Link>

        <div className="buy-again-card__price-row">
          <span className="buy-again-card__disc">-{disc}%</span>
          <span className="buy-again-card__price">₹{fmt(item.price)}</span>
        </div>
        <div className="buy-again-card__mrp">M.R.P: <s>₹{fmt(mrp)}</s></div>

        {item.is_prime && (
          <div className="buy-again-card__prime">prime</div>
        )}

        <button
          className={`buy-again-card__add-btn ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={busy}
        >
          {added ? '✓ Added' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
