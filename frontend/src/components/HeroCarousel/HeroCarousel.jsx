// HeroCarousel.jsx — Auto-rotating full-width banner
//
// Features:
//   - 4 slides with real Unsplash images, text, and CTA button
//   - Auto-advances every 5 seconds (pauses on hover)
//   - Arrow buttons for manual navigation
//   - Dot indicators show current slide
//   - CSS transform-based sliding (no library needed — pure CSS transitions)
//
// WHY NO LIBRARY?
// A simple carousel only needs: current index state + setInterval + CSS transform.
// Adding a library like Swiper.js for this would be over-engineering.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';

const SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1500&q=80',
    eyebrow: 'New Arrivals',
    title: 'Latest Electronics\nAt Unbeatable Prices',
    subtitle: 'Shop smartphones, laptops, headphones & more from top brands.',
    cta: 'Shop Electronics',
    link: '/products?category=electronics',
    accent: '#FF9900',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1500&q=80',
    eyebrow: "Fashion & Style",
    title: 'Refresh Your\nWardrobe Today',
    subtitle: "Trending styles from men's, women's, and more — all in one place.",
    cta: 'Shop Fashion',
    link: '/products?category=clothing',
    accent: '#FEBD69',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1500&q=80',
    eyebrow: 'Sports & Outdoors',
    title: 'Gear Up For\nEvery Adventure',
    subtitle: 'Running shoes, fitness gear, cycles, and sports equipment.',
    cta: 'Shop Sports',
    link: '/products?category=sports-outdoors',
    accent: '#90EE90',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1500&q=80',
    eyebrow: 'Books & More',
    title: 'Expand Your\nMind Every Day',
    subtitle: 'Bestsellers, fiction, non-fiction and educational books.',
    cta: 'Shop Books',
    link: '/products?category=books',
    accent: '#FFD700',
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const timerRef = useRef(null);

  // Auto-advance slide every 5 seconds (pauses on hover)
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, 5000);
  }, []);

  useEffect(() => {
    if (!paused) startTimer();
    return () => clearInterval(timerRef.current); // Cleanup on unmount
  }, [paused, startTimer]);

  const goTo = (idx) => {
    clearInterval(timerRef.current);
    setCurrent(idx);
    if (!paused) startTimer();
  };
  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  return (
    <div
      className="hero"
      onMouseEnter={() => { setPaused(true);  clearInterval(timerRef.current); }}
      onMouseLeave={() => { setPaused(false); startTimer(); }}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      {/* Slide track — CSS transform shifts all slides left/right */}
      <div
        className="hero__track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className="hero__slide"
            aria-hidden={i !== current}
            role="group"
            aria-roledescription="slide"
          >
            <img
              src={slide.image}
              alt={slide.title.replace('\n', ' ')}
              className="hero__slide-img"
              loading={i === 0 ? 'eager' : 'lazy'} // First slide loads immediately
            />
            <div className="hero__overlay" />

            {/* Text content */}
            {i === current && (
              <div className="hero__content fade-in">
                <p className="hero__eyebrow" style={{ color: slide.accent }}>
                  {slide.eyebrow}
                </p>
                <h2 className="hero__title">
                  {slide.title.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </h2>
                <p className="hero__subtitle">{slide.subtitle}</p>
                <Link to={slide.link} className="hero__cta">
                  {slide.cta} →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrow buttons */}
      <button className="hero__arrow hero__arrow--prev" onClick={prev} aria-label="Previous slide">‹</button>
      <button className="hero__arrow hero__arrow--next" onClick={next} aria-label="Next slide">›</button>

      {/* Dot indicators */}
      <div className="hero__dots" role="tablist">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero__dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={i === current}
            role="tab"
          />
        ))}
      </div>
    </div>
  );
}
