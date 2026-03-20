"use client";
import { Box, CircleAlert, Dices, Info, RotateCw } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useId, useMemo, useState } from "react";
import { DiceRollDisplay } from "@/components/dice/DiceRollDisplay";
import { DiceStatistics } from "@/components/dice/DiceStatistics";
import { D4, D8, D10, D12, D20 } from "@/components/icons/PolyhedralDice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateAverageDamageOnHit,
  calculateProbabilityDistribution,
  calculateTotalAverageDamage,
  type ProbabilityDistribution,
  parseDiceNotation,
  simulateRoll,
  VALID_DIE_SIZES,
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
  const [rollKey, setRollKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: rollKey is used to trigger re-rolls
  const sampleRoll = useMemo(() => {
    if (!mounted) {
      return { results: [], modifier: 0, primaryMod: 0, total: 0 };
    }
    const diceRoll = parseDiceNotation(lastValidDice);
    if (!diceRoll) {
      return { results: [], modifier: 0, primaryMod: 0, total: 0 };
    }
    return simulateRoll(diceRoll);
  }, [lastValidDice, rollKey, mounted]);

  useEffect(() => {
    try {
      const diceRoll = parseDiceNotation(diceNotation);
      if (!diceRoll) {
        setIsValidDice(false);
        const dieSizeMatch = diceNotation.toLowerCase().match(/\dd(\d+)/);
        const dieSize = dieSizeMatch
          ? Number.parseInt(dieSizeMatch[1], 10)
          : null;
        const advantageMatch = diceNotation.toLowerCase().match(/a(\d+)/);
        const disadvantageMatch = diceNotation.toLowerCase().match(/d(\d+)$/);

        if (
          dieSize !== null &&
          !(VALID_DIE_SIZES as readonly number[]).includes(dieSize)
        ) {
          setErrorMessage(
            `d${dieSize} is not a valid die size. Valid sizes: ${VALID_DIE_SIZES.map((s) => `d${s}`).join(", ")}`
          );
        } else if (
          advantageMatch &&
          Number.parseInt(advantageMatch[1], 10) >= 7
        ) {
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
    <div className="container mx-auto flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="w-2/3">
          <Label
            htmlFor={`diceNotation-${id}`}
            className="text-sm font-medium mb-2 flex items-center gap-1"
          >
            Dice Notation
            <Dialog>
              <DialogTrigger>
                <Info className="cursor-pointer size-4" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dice Notation</DialogTitle>
                  <DialogDescription asChild className="space-y-3">
                    <div>
                      <p>
                        Basic format: <code>XdY+Z</code> — roll X dice of size
                        Y, add modifier Z.
                      </p>
                      <p>
                        Valid die sizes:{" "}
                        {VALID_DIE_SIZES.map((s) => (
                          <code key={s}>d{s} </code>
                        ))}
                      </p>
                      <p className="font-semibold">
                        Flags (added after the die size):
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          <code>v</code> — <strong>Vicious:</strong> each
                          explosion adds an extra non-exploding die. E.g.{" "}
                          <code>1d8v</code>
                        </li>
                        <li>
                          <code>a</code> / <code>aN</code> —{" "}
                          <strong>Advantage:</strong> roll N extra dice, keep
                          the highest. E.g. <code>2d20a</code>
                        </li>
                        <li>
                          <code>d</code> / <code>dN</code> —{" "}
                          <strong>Disadvantage:</strong> roll N extra dice, keep
                          the lowest. E.g. <code>3d6d2-1</code>
                        </li>
                        <li>
                          <code>^N</code> / <code>^-N</code> —{" "}
                          <strong>Primary modifier:</strong> shift the primary
                          die&apos;s effective value, changing miss and crit
                          thresholds. E.g. <code>1d6^2</code> (rolls 1–3 hit,
                          rolls 4–6 crit)
                        </li>
                      </ul>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
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
        <div className="flex items-end">
          <D20 className="size-8" />
          <D12 className="size-8" />
          <D10 className="size-8" />
          <D8 className="size-8" />
          <Box className="size-8" />
          <D4 className="size-8" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="min-w-48 flex-1">
          <CardContent>
            <DiceRollDisplay
              results={sampleRoll.results}
              modifier={sampleRoll.modifier}
              primaryMod={sampleRoll.primaryMod}
              total={sampleRoll.total}
            />
          </CardContent>
          <CardFooter className="h-full flex justify-center">
            <Button
              onClick={() => setRollKey((k) => k + 1)}
              className="mx-auto"
            >
              <RotateCw className="size-4" />
              Reroll
            </Button>
          </CardFooter>
        </Card>

        <Card className="min-w-48 w-fit">
          <CardHeader>
            <h3 className="flex gap-1 items-center text-lg font-bold">
              <Dices className="size-4" />
              {lastValidDice}
            </h3>
          </CardHeader>
          <CardContent>
            <DiceStatistics
              averageRoll={averageRoll}
              totalAverageRoll={totalAverageRoll}
              missProbability={missProbability}
            />
          </CardContent>
        </Card>
      </div>

      {Object.keys(filteredProbabilities).length > 0 && (
        <Card className="flex-1 min-w-sm overflow-x-scroll">
          <CardContent className="p-6">
            <div className="overflow-x-auto " style={{ maxWidth: "100%" }}>
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
  );
}
