// Footer.jsx — Amazon-faithful multi-section footer
import { Link } from 'react-router-dom';
import './Footer.css';

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">

      {/* "Back to top" bar */}
      <div className="footer-top" onClick={scrollToTop} role="button" tabIndex={0} aria-label="Back to top">
        <span>Back to top</span>
      </div>

      {/* Four-column links grid */}
      <div className="footer-main">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Get to Know Us</h4>
            <ul>
              <li><a href="#">About Amazon</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press Releases</a></li>
              <li><a href="#">Amazon Science</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Make Money with Us</h4>
            <ul>
              <li><a href="#">Sell on Amazon</a></li>
              <li><a href="#">Sell under Amazon Accelerator</a></li>
              <li><a href="#">Amazon Associates</a></li>
              <li><a href="#">Advertise Your Products</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Let Us Help You</h4>
            <ul>
              <li><a href="#">Your Account</a></li>
              <li><Link to="/orders">Your Orders</Link></li>
              <li><Link to="/wishlist">Your Wish List</Link></li>
              <li><a href="#">Shipping Rates &amp; Policies</a></li>
              <li><a href="#">Returns &amp; Replacements</a></li>
              <li><a href="#">Customer Service</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Shop With Us</h4>
            <ul>
              <li><Link to="/products?category=electronics">Electronics</Link></li>
              <li><Link to="/products?category=clothing">Fashion</Link></li>
              <li><Link to="/products?category=books">Books</Link></li>
              <li><Link to="/products?category=home-kitchen">Home &amp; Kitchen</Link></li>
              <li><Link to="/products?category=sports-outdoors">Sports</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Logo + legal */}
      <div className="footer-bottom">
        <div className="footer-logo">amazon<span>.in</span></div>
        <div className="footer-legal">
          <a href="#">Conditions of Use &amp; Sale</a>
          <a href="#">Privacy Notice</a>
          <a href="#">Interest-Based Ads Notice</a>
        </div>
        <p className="footer-copy">© 1996–2024, Amazon.com, Inc. or its affiliates</p>
      </div>

    </footer>
  );
}
