import {
  calculateAverageDamageOnHit,
  calculateMissProbability,
  calculateProbabilityDistribution,
  calculateTotalAverageDamage,
  type DiceRoll,
  type ProbabilityDistribution,
} from "./dice";

export interface DiceStats {
  distribution: ProbabilityDistribution;
  averageRoll: number;
  totalAverageRoll: number;
  missProbability: number;
}

self.onmessage = ({ data }: MessageEvent<DiceRoll>) => {
  const distribution = calculateProbabilityDistribution(data);
  const stats: DiceStats = {
    distribution,
    averageRoll: calculateAverageDamageOnHit(distribution, data),
    totalAverageRoll: calculateTotalAverageDamage(distribution),
    missProbability: calculateMissProbability(distribution, data),
  };
  self.postMessage(stats);
};
