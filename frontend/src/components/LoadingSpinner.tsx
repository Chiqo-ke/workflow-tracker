export default function LoadingSpinner() {
  return (
    <div className="spinner-container">
      <div className="spinner" role="status" aria-label="Loading" />
      <span className="spinner-label">Loading…</span>
    </div>
  );
}
