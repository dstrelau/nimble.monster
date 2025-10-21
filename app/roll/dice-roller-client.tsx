"use client";
import { CircleAlert, Dices } from "lucide-react";
import { useQueryState } from "nuqs";
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
  const [diceNotation, setDiceNotation] = useQueryState("dice", {
    defaultValue: initialDice,
  });
  const [probabilities, setProbabilities] = useState<ProbabilityDistribution>(
    new Map()
  );
  const [averageRoll, setAverageRoll] = useState<number | null>(null);
  const [totalAverageRoll, setTotalAverageRoll] = useState<number | null>(null);
  const [isValidDice, setIsValidDice] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastValidDice, setLastValidDice] = useState(initialDice);

  useEffect(() => {
    try {
      const diceRoll = parseDiceNotation(diceNotation);
      if (!diceRoll) {
        setIsValidDice(false);
        const advantageMatch = diceNotation.toLowerCase().match(/a(\d+)/);
        const disadvantageMatch = diceNotation
          .toLowerCase()
          .match(/[^d]d(\d+)(?![d\d])/);

        if (advantageMatch && Number.parseInt(advantageMatch[1], 10) >= 7) {
          setErrorMessage(
            "Advantage values over 6 are not supported for performance reasons"
          );
        } else if (
          disadvantageMatch &&
          Number.parseInt(disadvantageMatch[1], 10) >= 7
        ) {
          setErrorMessage(
            "Disadvantage values over 6 are not supported for performance reasons"
          );
        } else {
          setErrorMessage("Invalid dice notation");
        }
        return;
      }
      setIsValidDice(true);
      setErrorMessage(null);
      setLastValidDice(diceNotation);
      const distribution = calculateProbabilityDistribution(diceRoll);
      const average = calculateAverageDamageOnHit(distribution);
      const totalAverage = calculateTotalAverageDamage(distribution);
      setAverageRoll(average);
      setTotalAverageRoll(totalAverage);
      setProbabilities(distribution);
    } catch {
      setIsValidDice(false);
      setErrorMessage("Invalid dice notation");
    }
  }, [diceNotation]);

  const missProbability = probabilities.get(0) || 0;

  const filteredProbabilities = Array.from(probabilities.entries())
    .filter(([r, p]) => r > 0 && p > 0.005)
    .sort(([_, a], [__, b]) => b - a)
    .sort(([a], [b]) => a - b);

  const barsToDisplay: Array<[number, number]> = [];
  if (missProbability > 0) {
    barsToDisplay.push([0, missProbability]);
  }

  if (filteredProbabilities.length > 0) {
    const minValue = filteredProbabilities[0][0];
    const maxValue = filteredProbabilities[filteredProbabilities.length - 1][0];
    const probabilityMap = new Map(filteredProbabilities);

    for (let i = minValue; i <= maxValue; i++) {
      barsToDisplay.push([i, probabilityMap.get(i) || 0]);
    }
  }

  const maxProbability =
    barsToDisplay.length > 0
      ? Math.max(...barsToDisplay.map(([_, p]) => p))
      : 0;

  // Calculate scale factor to make tallest bar 216px high (180 * 1.2)
  const scaleFactor = maxProbability > 0 ? 216 / maxProbability : 0;

  return (
    <div className="container mx-auto flex flex-col">
      <div className="flex gap-4 mb-6">
        <div className="w-2/3">
          <Label
            htmlFor={`diceNotation-${id}`}
            className="text-sm font-medium mb-2 flex items-center gap-1"
          >
            Dice Notation
            {!isValidDice && <CircleAlert className="size-4 stroke-error" />}
          </Label>
          <Input
            id={`diceNotation-${id}`}
            type="text"
            value={diceNotation}
            onChange={(e) => {
              setDiceNotation(e.target.value);
            }}
            placeholder="3d6+2"
            className="text-xl"
            onKeyDown={(e) => e.key === "Enter"}
          />
          {!isValidDice && errorMessage && (
            <p className="text-sm text-error mt-1">{errorMessage}</p>
          )}
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
                  value: totalAverageRoll ? totalAverageRoll.toFixed(1) : "-",
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
                    height: "264px",
                    minWidth: `${barsToDisplay.length * 48 + 24}px`,
                    position: "relative",
                  }}
                >
                  {barsToDisplay.map(([outcome, probability], index) => {
                    const height = Math.max(1, probability * scaleFactor);
                    const isGap = index === 0 && outcome === 0;
                    const xOffset = isGap ? 0 : index * 42 + 12 + 24;

                    return (
                      <div key={outcome}>
                        <div
                          className="absolute text-center text-xs text-foreground"
                          style={{
                            bottom: `${height + 31}px`,
                            left: `${xOffset}px`,
                            width: "36px",
                          }}
                        >
                          {(100 * probability).toFixed(1)}%
                        </div>
                        {probability > 0 && (
                          <div
                            className="absolute bg-primary rounded-t"
                            style={{
                              height: `${height}px`,
                              width: "36px",
                              bottom: "29px",
                              left: `${xOffset}px`,
                            }}
                          />
                        )}
                        <div
                          className="absolute text-sm font-medium text-center text-foreground"
                          style={{
                            bottom: "0px",
                            left: `${xOffset}px`,
                            width: "36px",
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
    </div>
  );
}
