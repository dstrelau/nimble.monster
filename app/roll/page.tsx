"use client";
import { Sword } from "lucide-react";
import { useEffect, useState } from "react";
import {
  calculateAverageDamageOnHit,
  calculateProbabilityDistribution,
  type ProbabilityDistribution,
  parseDiceNotation,
} from "../../lib/dice";

export default function DiceRollerPage() {
  return (
    <div className="container mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <DiceRollerApp />
      </div>
    </div>
  );
}

const DiceRollerApp = () => {
  const [diceNotation, setDiceNotation] = useState("3d6+2");
  const [probabilities, setProbabilities] = useState<ProbabilityDistribution>(
    new Map()
  );
  const [averageRoll, setAverageRoll] = useState<number | null>(null);

  useEffect(() => {
    try {
      const diceRoll = parseDiceNotation(diceNotation);
      if (!diceRoll) return;
      const distribution = calculateProbabilityDistribution(diceRoll);
      const average = calculateAverageDamageOnHit(distribution);
      setAverageRoll(average);
      setProbabilities(distribution);
    } catch {
      setProbabilities(new Map());
      setAverageRoll(null);
    }
  }, [diceNotation]);

  const missProbability = probabilities.get(0) || 0;

  const filteredProbabilities = Array.from(probabilities.entries())
    .filter(([r, p]) => r > 0 && p > 0.005)
    .sort(([_, a], [__, b]) => b - a)
    .sort(([a], [b]) => a - b);

  const maxProbability =
    filteredProbabilities.length > 0
      ? Math.max(...filteredProbabilities.map(([_, p]) => p))
      : 0;

  // Calculate scale factor to make tallest bar 180px high
  const scaleFactor = maxProbability > 0 ? 180 / maxProbability : 0;

  return (
    <div className="flex flex-col p-6 max-w-4xl mx-auto">
      <div className="flex gap-2 mb-2">
        <div className="w-2/3">
          <label
            htmlFor="diceNotation"
            className="block text-sm font-medium mb-1"
          >
            Dice Notation
          </label>
          <input
            id="diceNotation"
            type="text"
            value={diceNotation}
            onChange={(e) => setDiceNotation(e.target.value)}
            placeholder="3d6+2"
            className="d-input d-input-lg w-full p-2 border rounded focus:ring focus:ring-blue-300 bg-white"
            onKeyDown={(e) => e.key === "Enter"}
          />
        </div>
        <div className="d-stats d-shadow bg-base-300">
          <div className="d-stat">
            <div className="d-stat-figure hidden md:block">
              <Sword className="w-8 h-8" />
            </div>
            <div className="d-stat-title">Avg. Damage on Hit</div>
            <div className="d-stat-value">
              {averageRoll ? averageRoll.toFixed(1) : "-"}
            </div>
            <div className="d-stat-desc">
              Chance to Miss: {(100 * missProbability).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {Object.keys(filteredProbabilities).length > 0 && (
        <div className="border rounded p-4 bg-white">
          <div
            className="my-8 overflow-x-auto pb-6"
            style={{ maxWidth: "100%" }}
          >
            <div
              style={{
                height: "220px",
                minWidth: `${filteredProbabilities.length * 40 + 20}px`,
                position: "relative",
              }}
            >
              {filteredProbabilities.map(([outcome, probability], index) => {
                const height = Math.max(1, probability * scaleFactor);

                return (
                  <div key={outcome}>
                    <div
                      className="absolute text-center text-[.6rem] text-primary-content bg-primary rounded-t"
                      style={{
                        height: `${height}px`,
                        width: "30px",
                        bottom: "24px",
                        left: `${index * 35 + 10}px`,
                      }}
                    >
                      {(100 * probability).toFixed(1)}%
                    </div>
                    <div
                      className="absolute text-xs font-medium text-center"
                      style={{
                        bottom: "0px",
                        left: `${index * 35 + 10}px`,
                        width: "30px",
                      }}
                    >
                      {outcome}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
