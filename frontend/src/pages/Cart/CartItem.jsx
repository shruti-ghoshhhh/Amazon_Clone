import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';

const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const getPrimaryImage = (images = []) => {
  if (!images || images.length === 0) return 'https://via.placeholder.com/130?text=No+Image';
  const primary = images.find(img => img.is_primary);
  return (primary || images[0]).url;
};

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const { addToWishlist } = useWishlist();
  const [updating, setUpdating] = useState(false);

  const product  = item.product || {};
  const imageUrl = getPrimaryImage(product.images);
  const maxQty   = Math.min(product.stock_qty || 10, 10);

  const handleQty = async (delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1 || newQty > maxQty) return;
    setUpdating(true);
    await updateQuantity(item.id, newQty);
    setUpdating(false);
  };

  const handleRemove = async () => {
    setUpdating(true);
    await removeFromCart(item.id);
  };

  const handleSaveForLater = async () => {
    setUpdating(true);
    await addToWishlist(product.id);
    await removeFromCart(item.id);
  };

  const lineTotal = parseFloat(product.price) * item.quantity;
  const isLowStock = product.stock_qty < 5;
  const oldPrice = parseFloat(product.price) * 1.5; // Simulated MRP

  return (
    <div className={`cart-item ${updating ? 'updating' : ''}`}
      style={{ opacity: updating ? 0.6 : 1, transition: 'opacity 0.2s' }}>

      {/* Checkbox (visual only) */}
      <div className="cart-item__checkbox">
        <input type="checkbox" defaultChecked aria-label="Select item" />
      </div>

      {/* Image */}
      <Link to={`/products/${product.id}`} className="cart-item__img-wrap">
        <img
          src={imageUrl}
          alt={product.name}
          className="cart-item__img"
          loading="lazy"
          onError={e => { e.target.src = 'https://via.placeholder.com/130?text=No+Image'; }}
        />
      </Link>

      {/* Info */}
      <div className="cart-item__info">
        <div className="cart-item__header-row">
          <Link to={`/products/${product.id}`} className="cart-item__title">
            {product.name}
          </Link>
          <div className="cart-item__price-main-mobile">₹{fmt(lineTotal)}</div>
        </div>

        {isLowStock ? (
          <div className="cart-item__stock low-stock">Only {product.stock_qty} left in stock.</div>
        ) : (
          <div className="cart-item__stock">In Stock</div>
        )}
        
        <div className="cart-item__delivery-badge">
           <span className="cart-item__prime">prime</span>
           <span className="cart-item__delivery-text">FREE delivery <strong>Fri, 29 May</strong></span>
        </div>

        <div className="cart-item__gift">
          <label><input type="checkbox" /> This will be a gift <a href="#">Learn more</a></label>
        </div>

        <div className="cart-item__meta">
          <strong>Size:</strong> L<br/>
          <strong>Colour:</strong> Blue
        </div>

        {/* Qty stepper + actions */}
        <div className="cart-item__actions">
          <div className="cart-qty-wrap">
            <button
              className="cart-qty-btn cart-qty-del"
              onClick={item.quantity === 1 ? handleRemove : () => handleQty(-1)}
              disabled={updating}
              aria-label={item.quantity === 1 ? 'Delete item' : 'Decrease quantity'}
            >
              {item.quantity === 1 ? '🗑️' : '−'}
            </button>
            <span className="cart-qty-num" aria-live="polite">{item.quantity}</span>
            <button
              className="cart-qty-btn cart-qty-add"
              onClick={() => handleQty(1)}
              disabled={updating || item.quantity >= maxQty}
              aria-label="Increase quantity"
            >+</button>
          </div>

          <span className="cart-action-sep">|</span>
          <button className="cart-action-btn delete" onClick={handleRemove} disabled={updating}>Delete</button>
          <span className="cart-action-sep">|</span>
          <button className="cart-action-btn" onClick={handleSaveForLater} disabled={updating}>Save for later</button>
          <span className="cart-action-sep">|</span>
          <button className="cart-action-btn">Share</button>
        </div>
      </div>

      {/* Price Desktop */}
      <div className="cart-item__price">
        <div className="cart-item__price-main">₹{fmt(lineTotal)}</div>
        <div className="cart-item__price-mrp">M.R.P: <strike>₹{fmt(oldPrice)}</strike></div>
        <div className="cart-item__cashback">
           5% back with Amazon Pay ICICI card <a href="#">Shop items</a>
        </div>
      </div>
    </div>
  );
}
