/**
 * Exploding Dice Roller
 *
 * This TypeScript implementation handles dice notation like "1d8" or "3d6+2" with
 * special dice rules:
 * - When the first die rolls its maximum value, reroll and add the new value
 * - This may happen multiple times until a non-maximum value is rolled
 * - Only the first die can explode, other dice never explode
 * - If the first die rolls a 1, the entire roll equals 0 (critical failure)
 */

type DiceRoll = {
  numDice: number;
  dieSize: number;
  modifier: number;
};

export type ProbabilityDistribution = Map<number, number>;

export function parseDiceNotation(notation: string): DiceRoll | null {
  const diceRegex = /^(\d+)d(\d+)(?:([+-])(\d+))?$/;
  const match = notation.trim().toLowerCase().match(diceRegex);

  if (!match) {
    return null;
  }

  const numDice = Number.parseInt(match[1], 10);
  const dieSize = Number.parseInt(match[2], 10);
  let modifier = 0;

  if (match[3] && match[4]) {
    modifier = Number.parseInt(match[4], 10);
    if (match[3] === "-") {
      modifier = -modifier;
    }
  }

  if (numDice <= 0 || dieSize <= 0) {
    return null;
  }

  return { numDice, dieSize, modifier };
}

function primaryDie(dieSize: number): ProbabilityDistribution {
  const baseProbability = 1 / dieSize;
  const result: ProbabilityDistribution = new Map([[0, baseProbability]]);
  // 1 == miss, so start at 2
  for (let i = 2; i < dieSize; i++) {
    result.set(i, baseProbability);
  }

  let currentProbability = baseProbability;
  let explodingValue = dieSize;

  const maxExplosions = 4;

  for (let explosion = 1; explosion <= maxExplosions; explosion++) {
    // Probability of getting this explosion (reduces with each explosion)
    currentProbability *= 1 / dieSize;
    // Add probability for each possible value after exploding
    for (let i = 1; i < dieSize; i++) {
      const outcomeValue = explodingValue + i;
      result.set(
        outcomeValue,
        (result.get(outcomeValue) || 0) + currentProbability
      );
    }

    explodingValue += dieSize;
  }

  return result;
}

function applyModifier(
  distribution: ProbabilityDistribution,
  mod: number
): ProbabilityDistribution {
  if (mod === 0) return distribution;
  const result = new Map<number, number>();
  for (const [roll, p] of distribution) {
    if (roll === 0) {
      result.set(roll, p);
      continue;
    }
    const sum = roll + mod;
    result.set(sum, (result.get(sum) || 0) + p);
  }
  return result;
}

function regularDiceDistribution(
  numDice: number,
  dieSize: number
): ProbabilityDistribution {
  if (numDice === 1) {
    const result: ProbabilityDistribution = new Map<number, number>();
    const probability = 1 / dieSize;
    for (let i = 1; i <= dieSize; i++) {
      result.set(i, probability);
    }
    return result;
  }

  let result: ProbabilityDistribution = regularDiceDistribution(1, dieSize);
  for (let i = 1; i < numDice; i++) {
    const singleDie = regularDiceDistribution(1, dieSize);
    result = combineProbabilityDistributions(result, singleDie);
  }
  return result;
}

function combineProbabilityDistributions(
  d1: ProbabilityDistribution,
  d2: ProbabilityDistribution
): ProbabilityDistribution {
  const result: ProbabilityDistribution = new Map();
  const missP = d1.get(0);
  if (missP) {
    result.set(0, missP);
  }
  for (const [r1, p1] of d1) {
    // if roll is zero, that's a miss. don't count anything else.
    if (r1 === 0) continue;
    for (const [r2, p2] of d2) {
      const totalRoll = r1 + r2;
      const combinedP = p1 * p2;
      result.set(totalRoll, (result.get(totalRoll) || 0) + combinedP);
    }
  }
  return result;
}

export function calculateProbabilityDistribution(
  diceRoll: DiceRoll
): ProbabilityDistribution {
  const { numDice, dieSize, modifier } = diceRoll;

  let result: ProbabilityDistribution;
  if (numDice === 1) {
    result = primaryDie(dieSize);
  } else {
    const firstDieDistribution = primaryDie(dieSize);
    const restDistribution = regularDiceDistribution(numDice - 1, dieSize);
    result = combineProbabilityDistributions(
      firstDieDistribution,
      restDistribution
    );
  }

  if (modifier !== 0) {
    result = applyModifier(result, modifier);
  }

  return result;
}

export function calculateAverageDamageOnHit(
  distribution: ProbabilityDistribution
): number {
  const hitP = 1 - (distribution.get(0) || 1);

  let sum = 0;
  for (const [roll, p] of distribution) {
    if (roll === 0) continue;
    // re-scale probabilities to be "on hit"
    sum += roll * p * (1 / hitP);
  }

  return sum;
}
