export const calculateOverallPerformance = (
  quality: number,
  time: number,
  qualityWeight: number = 0.6,
  timeWeight: number = 0.4
): number => {
  return (quality * qualityWeight + time * timeWeight);
};

export const calculateEarnings = (
  time: number,
  hourlyRate: number,
  bonusMultiplier: number,
  extraBonus: number = 0
): number => {
  return (time * hourlyRate * bonusMultiplier) + extraBonus;
};

export const getPerformanceLevel = (
  percentage: number,
  thresholds: {
    excellent: number;
    good: number;
    average: number;
    minimum: number;
  }
): string => {
  if (percentage >= thresholds.excellent) return 'excellent';
  if (percentage >= thresholds.good) return 'good';
  if (percentage >= thresholds.average) return 'average';
  if (percentage >= thresholds.minimum) return 'minimum';
  return 'below';
};

export const getBonusMultiplier = (
  performanceLevel: string,
  bonusRates: {
    excellent: number;
    good: number;
    average: number;
    minimum: number;
    below: number;
  }
): number => {
  switch (performanceLevel) {
    case 'excellent': return bonusRates.excellent;
    case 'good': return bonusRates.good;
    case 'average': return bonusRates.average;
    case 'minimum': return bonusRates.minimum;
    default: return bonusRates.below;
  }
};