// backend/aiSeverity.js
/**
 * Very simple rule-based + weighted scoring for demo "AI severity"
 * Returns score 0–100 and label
 */
function calculateSeverity(report) {
  let score = 0;

  // Source multiplier
  if (report.source === 'satellite') score += 35;
  if (report.source === 'citizen')    score += 20;

  // Type severity
  const typeScores = {
    construction:   40,
    'sand mining':  55,
    'waste dumping':35,
    'land filling': 45,
    other:          25
  };
  score += typeScores[report.type?.toLowerCase()] || 20;

  // Confidence from ML (if exists)
  if (report.confidence && report.confidence > 70) score += 15;

  // Area / impact proxy
  if (report.area_px && report.area_px > 500) score += 10;

  score = Math.min(100, Math.max(0, Math.round(score)));

  let label = 'Low';
  if (score >= 75) label = 'Critical';
  else if (score >= 50) label = 'High';
  else if (score >= 30) label = 'Medium';

  return { score, label };
}

module.exports = { calculateSeverity };