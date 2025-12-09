// Simple date formatting helper to ensure consistent SSR/CSR output
export function formatDate(date, opts = { year: 'numeric', month: 'short', day: 'numeric' }, locale = 'en-US') {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString(locale, opts);
  } catch {
    return '';
  }
}
