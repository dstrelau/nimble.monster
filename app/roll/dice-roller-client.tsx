"use client";
import { CircleAlert, Dices } from "lucide-react";
import React, { useEffect, useId, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateAverageDamageOnHit,
  calculateProbabilityDistribution,
  calculateTotalAverageDamage,
  type ProbabilityDistribution,
  parseDiceNotation,
} from "../../lib/dice";

type Props = {
  initialDice: string;
};

export function DiceRollerClient({ initialDice }: Props) {
  const id = useId();
  const [diceNotation, setDiceNotation] = useState(initialDice);
  const [probabilities, setProbabilities] = useState<ProbabilityDistribution>(
    new Map()
  );
  const [averageRoll, setAverageRoll] = useState<number | null>(null);
  const [totalAverageRoll, setTotalAverageRoll] = useState<number | null>(null);
  const [isValidDice, setIsValidDice] = useState(true);
  const [lastValidDice, setLastValidDice] = useState(initialDice);

  useEffect(() => {
    try {
      const diceRoll = parseDiceNotation(diceNotation);
      if (!diceRoll) {
        setIsValidDice(false);
        return;
      }
      setIsValidDice(true);
      setLastValidDice(diceNotation);
      const distribution = calculateProbabilityDistribution(diceRoll);
      const average = calculateAverageDamageOnHit(distribution);
      const totalAverage = calculateTotalAverageDamage(distribution);
      setAverageRoll(average);
      setTotalAverageRoll(totalAverage);
      setProbabilities(distribution);
    } catch {
      setIsValidDice(false);
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
    <div className="container mx-auto">
      <div className="shadow-lg rounded-lg overflow-hidden">
        <div className="flex flex-col p-6 max-w-7xl mx-auto">
          <div className="flex gap-4 mb-6">
            <div className="w-2/3">
              <Label
                htmlFor={`diceNotation-${id}`}
                className="text-sm font-medium mb-2 flex items-center gap-1"
              >
                Dice Notation
                {!isValidDice && (
                  <CircleAlert className="size-4 stroke-red-500" />
                )}
              </Label>
              <Input
                id={`diceNotation-${id}`}
                type="text"
                value={diceNotation}
                onChange={(e) => {
                  setDiceNotation(e.target.value);
                }}
                placeholder="3d6+2"
                className="text-lg"
                onKeyDown={(e) => e.key === "Enter"}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Card className="min-w-48">
              <CardHeader>
                <h3 className="flex gap-1 items-center text-lg font-bold">
                  <Dices className="size-4" />
                  {lastValidDice}
                </h3>
              </CardHeader>
              <CardContent>
                <dl>
                  {[
                    {
                      label: "Avg. Damage on Hit",
                      value: averageRoll ? averageRoll.toFixed(1) : "-",
                    },
                    {
                      label: "Avg. Damage",
                      value: totalAverageRoll
                        ? totalAverageRoll.toFixed(1)
                        : "-",
                    },
                    {
                      label: "Chance to Miss",
                      value: `${(100 * missProbability).toFixed(1)}%`,
                    },
                  ].map((item) => (
                    <React.Fragment key={item.label}>
                      <dt className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="text-lg font-bold">{item.value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </CardContent>
            </Card>
            {Object.keys(filteredProbabilities).length > 0 && (
              <Card className="flex-1 min-w-sm overflow-x-scroll">
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
                      {filteredProbabilities.map(
                        ([outcome, probability], index) => {
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
                        }
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
