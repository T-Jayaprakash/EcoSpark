/**
 * Compute status from water level percentage.
 * < 40   → NORMAL
 * 40–70  → WARNING
 * > 70   → CRITICAL
 */
function computeStatus(waterLevelPct) {
  const v = parseFloat(waterLevelPct);
  if (v > 70) return 'CRITICAL';
  if (v >= 40) return 'WARNING';
  return 'NORMAL';
}

module.exports = { computeStatus };
