/**
 * Performance calculation utilities.
 *
 * EARNINGS RULE (updated): earnings = hours × rate ONLY.
 * No performance multiplier is applied. bonusMultiplier param is accepted
 * but ignored so existing call-sites don't break — it is always treated as 1.
 */

export const QUALITY_WEIGHT = 0.6;
export const TIME_WEIGHT = 0.4;

export const calculateOverallPerformance = (
  quality: number,
  time: number,
  qualityWeight: number = QUALITY_WEIGHT,
  timeWeight: number = TIME_WEIGHT
): number => {
  return quality * qualityWeight + time * timeWeight;
};

/**
 * FIX (Issue: incorrect earnings on all pages)
 * Earnings = hours × rate ONLY. The bonusMultiplier param is intentionally
 * ignored — keeping it in the signature avoids breaking existing call-sites.
 */
export const calculateEarnings = (
  time: number,
  hourlyRate: number,
  _bonusMultiplier: number = 1,   // ignored — kept for API compat
  extraBonus: number = 0
): number => {
  return time * hourlyRate + extraBonus;
};

export const getPerformanceLevel = (
  percentage: number,
  thresholds: {
    excellent: number;
    good: number;
    average: number;
    minimum: number;
  } = { excellent: 80, good: 70, average: 60, minimum: 50 }
): string => {
  if (percentage >= thresholds.excellent) return 'excellent';
  if (percentage >= thresholds.good) return 'good';
  if (percentage >= thresholds.average) return 'average';
  if (percentage >= thresholds.minimum) return 'minimum';
  return 'below';
};

/**
 * getBonusMultiplier is kept for display purposes (performance tier badges)
 * but is NOT used in earnings calculations.
 */
export const getBonusMultiplier = (
  performanceLevel: string,
  bonusRates: {
    excellent: number;
    good: number;
    average: number;
    minimum: number;
    below: number;
  } = { excellent: 1.2, good: 1.1, average: 1.0, minimum: 0.9, below: 0.8 }
): number => {
  switch (performanceLevel) {
    case 'excellent': return bonusRates.excellent;
    case 'good': return bonusRates.good;
    case 'average': return bonusRates.average;
    case 'minimum': return bonusRates.minimum;
    default: return bonusRates.below;
  }
};