// StarRating.jsx — Amazon.in faithful star rating display
//
// Renders proper SVG stars with:
//   - Filled orange stars (whole)
//   - Partial star (clip-path for exact fraction)
//   - Empty grey stars
//   - Numeric rating value + "(review count)" links
//
// Used in: ProductCard, ProductDetail, ProductListing sidebar

const StarRating = ({ rating = 0, count = null, size = 14, showValue = true }) => {
  const clampedRating = Math.min(5, Math.max(0, rating));

  // Build an array of 5 star fill-fractions: 0 = empty, 1 = full, 0.x = partial
  const starFills = Array.from({ length: 5 }, (_, i) => {
    const diff = clampedRating - i;
    if (diff >= 1)  return 1;         // Full star
    if (diff <= 0)  return 0;         // Empty star
    return Math.round(diff * 10) / 10; // Partial — round to 1 decimal
  });

  // Unique clip id per rating to avoid SVG conflicts when multiple cards render
  const clipId = `star-clip-${Math.round(clampedRating * 10)}`;

  return (
    <span
      className="stars"
      aria-label={`${clampedRating.toFixed(1)} out of 5 stars${count !== null ? `, ${count.toLocaleString()} ratings` : ''}`}
      title={`${clampedRating.toFixed(1)} out of 5 stars`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
    >
      {/* Numeric rating value — matches Amazon's "4.6" prefix before stars */}
      {showValue && clampedRating > 0 && (
        <span style={{
          fontSize: size,
          color: '#c45500',          /* Amazon's dark orange for rating number */
          fontWeight: 400,
          marginRight: 2,
          lineHeight: 1,
        }}>
          {clampedRating.toFixed(1)}
        </span>
      )}

      {/* 5 SVG stars */}
      {starFills.map((fill, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{ display: 'block', flexShrink: 0 }}
        >
          {/* Partial star: define a clip rectangle that covers "fill" fraction */}
          {fill > 0 && fill < 1 && (
            <defs>
              <clipPath id={`${clipId}-${i}`}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
          )}

          {/* Grey empty star (background) */}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={fill === 0 ? '#ddd' : '#ddd'}
            stroke="none"
          />

          {/* Orange filled star (foreground, clipped for partial) */}
          {fill > 0 && (
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill="#FF9900"
              stroke="none"
              clipPath={fill < 1 ? `url(#${clipId}-${i})` : undefined}
            />
          )}
        </svg>
      ))}

      {/* Review count "(2,876)" — links blue like Amazon */}
      {count !== null && (
        <span
          className="review-count"
          style={{
            fontSize: size,
            color: '#007185',
            marginLeft: 4,
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          ({count.toLocaleString('en-IN')})
        </span>
      )}
    </span>
  );
};

export default StarRating;
