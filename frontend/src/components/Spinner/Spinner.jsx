// Spinner.jsx — Loading indicator used during API calls and lazy page loads
const Spinner = ({ size = 40, message = '' }) => (
  <div className="spinner-wrap" style={{ flexDirection: 'column', gap: '12px' }}>
    <div className="spinner" style={{ width: size, height: size }} />
    {message && <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>{message}</p>}
  </div>
);
export default Spinner;
