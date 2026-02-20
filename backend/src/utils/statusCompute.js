/**
 * utils/statusCompute.js
 * < 40  → NORMAL
 * 40–70 → WARNING
 * > 70  → CRITICAL
 */
function computeStatus(value) {
    const v = parseFloat(value);
    if (v > 70) return 'CRITICAL';
    if (v >= 40) return 'WARNING';
    return 'NORMAL';
}

module.exports = { computeStatus };
