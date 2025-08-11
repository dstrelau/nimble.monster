"use client";
import { Sword } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateAverageDamageOnHit,
  calculateProbabilityDistribution,
  type ProbabilityDistribution,
  parseDiceNotation,
} from "../../lib/dice";

export default function DiceRollerPage() {
  return (
    <div className="container mx-auto">
      <div className="shadow-lg rounded-lg overflow-hidden">
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
      <div className="flex gap-4 mb-6">
        <div className="w-2/3">
          <Label htmlFor="diceNotation" className="text-sm font-medium mb-2">
            Dice Notation
          </Label>
          <Input
            id="diceNotation"
            type="text"
            value={diceNotation}
            onChange={(e) => setDiceNotation(e.target.value)}
            placeholder="3d6+2"
            className="text-lg"
            onKeyDown={(e) => e.key === "Enter"}
          />
        </div>
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sword className="w-6 h-6 hidden md:block" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Avg. Damage on Hit
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {averageRoll ? averageRoll.toFixed(1) : "-"}
            </div>
            <div className="text-sm text-muted-foreground">
              Chance to Miss: {(100 * missProbability).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(filteredProbabilities).length > 0 && (
        <Card>
          <CardContent className="p-6">
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
                        className="absolute text-center text-[.6rem] text-primary-foreground bg-primary rounded-t"
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
                        className="absolute text-xs font-medium text-center text-foreground"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};
