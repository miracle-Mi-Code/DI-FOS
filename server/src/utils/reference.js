/**
 * Generate a unique reference number for file submissions
 * Format: DFOS-YYYY-XXXXX (e.g. DFOS-2026-A8F92)
 */
function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `DFOS-${year}-${randomHex}`;
}

module.exports = {
  generateReferenceNumber,
};
