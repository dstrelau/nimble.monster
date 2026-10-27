"use client";
import { Box, CircleAlert, Dices, Info, RotateCw } from "lucide-react";
import { parseDiceNotation, simulateRoll, VALID_DIE_SIZES } from "nimble-dice";
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
import { useDiceStatistics } from "@/lib/hooks/useDiceStatistics";

type Props = {
  initialDice: string;
};

export function DiceRollerClient({ initialDice }: Props) {
  const id = useId();
  const [diceNotation, setDiceNotation] = useQueryState("dice", {
    defaultValue: initialDice,
  });
  const [isValidDice, setIsValidDice] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastValidDice, setLastValidDice] = useState(initialDice);
  const { stats, pending, showLoading, error } =
    useDiceStatistics(lastValidDice);
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
        // Skip the die size itself so d100 is not read as disadvantage 100.
        const disadvantageMatch = diceNotation
          .toLowerCase()
          .match(/d\d+[vn]*d(\d+)/);

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
    } catch {
      setIsValidDice(false);
      setErrorMessage("Invalid dice notation");
    }
  }, [diceNotation]);

  const parsedDice = parseDiceNotation(lastValidDice);
  const missProbability = stats?.missProbability ?? 0;

  const filteredProbabilities = Array.from(stats?.distribution.entries() ?? [])
    .filter(([r, p]) => p > 0.005 && (parsedDice?.normal === true || r > 0))
    .sort(([_, a], [__, b]) => b - a)
    .sort(([a], [b]) => a - b);

  const barsToDisplay: Array<[number, number]> = [];
  let compactHistogram = false;
  if (missProbability > 0) {
    barsToDisplay.push([0, missProbability]);
  }

  if (filteredProbabilities.length > 0) {
    const minValue = filteredProbabilities[0][0];
    const maxValue = filteredProbabilities[filteredProbabilities.length - 1][0];
    // Filling every gap can freeze the main thread for large crit bonuses.
    // Unsafe integer outcomes also cannot be advanced reliably with i++.
    compactHistogram =
      !Number.isSafeInteger(minValue) ||
      !Number.isSafeInteger(maxValue) ||
      maxValue - minValue >= 200;
    if (compactHistogram) {
      barsToDisplay.push(...filteredProbabilities);
    } else {
      const probabilityMap = new Map(filteredProbabilities);
      for (let offset = 0; offset <= maxValue - minValue; offset++) {
        const value = minValue + offset;
        barsToDisplay.push([value, probabilityMap.get(value) || 0]);
      }
    }
  }

  const maxProbability =
    barsToDisplay.length > 0
      ? Math.max(...barsToDisplay.map(([_, p]) => p))
      : 0;

  // Calculate scale factor to make tallest bar 216px high (180 * 1.2)
  const scaleFactor = maxProbability > 0 ? 216 / maxProbability : 0;
  const labelWidth = Math.max(
    36,
    ...barsToDisplay.map(([outcome]) => String(outcome).length * 8)
  );

  return (
    <div className="container mx-auto flex flex-col gap-4">
      <div className="space-y-1">
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
                            <strong>Disadvantage:</strong> roll N extra dice,
                            keep the lowest. E.g. <code>3d6d2-1</code>
                          </li>
                          <li>
                            <code>n</code> — <strong>Normal:</strong> disable
                            misses and exploding critical hits. Cannot be
                            combined with <code>v</code>, <code>^N</code>, or a
                            crit bonus. E.g. <code>3d6n+2</code>
                          </li>
                          <li>
                            <code>^N</code> / <code>^-N</code> —{" "}
                            <strong>Primary modifier:</strong> shift the primary
                            die&apos;s effective value, changing miss and crit
                            thresholds. E.g. <code>1d6^2</code> (rolls 1–3 hit,
                            rolls 4–6 crit)
                          </li>
                        </ul>
                        <p>
                          <strong>Crit bonus:</strong> append <code>+Nc</code>{" "}
                          to add N only on a critical hit, once per roll—not per
                          explosion. E.g. <code>1d10+5c</code>, or{" "}
                          <code>1d10+2+5c</code> for +2 on every hit and another
                          +5 on a crit. The crit bonus must be nonnegative and
                          come last; it cannot be used with normal, compound, or
                          tens/ones rolls.
                        </p>
                        <p>
                          <strong>Compound rolls</strong> such as{" "}
                          <code>1d20+1d10+3</code> are always normal and cannot
                          use special flags.
                        </p>
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
              aria-invalid={!isValidDice}
              aria-describedby={`diceNotation-error-${id}`}
              onKeyDown={(e) => e.key === "Enter"}
            />
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
        <p
          id={`diceNotation-error-${id}`}
          className="min-h-15 sm:min-h-10 lg:min-h-5 text-sm text-error"
          aria-live="polite"
        >
          {!isValidDice && errorMessage}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="min-w-48 flex-1">
          <CardContent>
            <DiceRollDisplay
              results={sampleRoll.results}
              modifier={sampleRoll.modifier}
              primaryMod={sampleRoll.primaryMod}
              critModifier={parsedDice?.critModifier}
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

        <Card className="min-w-48 w-fit max-w-full">
          <CardHeader>
            <h3 className="flex gap-1 items-center text-lg font-bold">
              <Dices className="size-4 shrink-0" />
              <span className="break-all">{lastValidDice}</span>
            </h3>
          </CardHeader>
          <CardContent className="min-h-36">
            <DiceStatistics
              averageRoll={stats?.averageRoll ?? null}
              totalAverageRoll={stats?.totalAverageRoll ?? null}
              missProbability={stats?.missProbability ?? null}
              pending={pending}
              showLoading={showLoading}
              error={error}
            />
          </CardContent>
        </Card>
      </div>

      {pending ? (
        <Card className="flex-1 min-w-0" aria-busy="true">
          <CardContent className="flex h-[312px] items-center justify-center p-6">
            {showLoading && (
              <div
                role="img"
                aria-label="Loading probability graph"
                className="flex h-[264px] w-full max-w-xl items-end justify-center gap-2 border-b border-muted pb-7"
              >
                {[
                  24, 42, 65, 96, 132, 168, 200, 216, 196, 158, 112, 76, 48, 28,
                ].map((height) => (
                  <div
                    key={height}
                    className="flex-1 rounded-t bg-muted"
                    style={{ height }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        Object.keys(filteredProbabilities).length > 0 && (
          <Card className="flex-1 min-w-0 overflow-x-auto">
            <CardContent className="p-6">
              {compactHistogram && (
                <p className="mb-2 text-sm text-muted-foreground">
                  Outcome gaps omitted.
                </p>
              )}
              <div className="overflow-x-auto " style={{ maxWidth: "100%" }}>
                <div
                  style={{
                    height: "264px",
                    minWidth: `${barsToDisplay.length * (labelWidth + 12) + 24}px`,
                    position: "relative",
                  }}
                >
                  {barsToDisplay.map(([outcome, probability], index) => {
                    const height = Math.max(1, probability * scaleFactor);
                    const isGap =
                      missProbability > 0 && index === 0 && outcome === 0;
                    const xOffset = isGap
                      ? 0
                      : index * (labelWidth + 6) + 12 + 24;

                    return (
                      <div key={outcome}>
                        <div
                          className="absolute text-center text-xs text-foreground"
                          style={{
                            bottom: `${height + 31}px`,
                            left: `${xOffset}px`,
                            width: `${labelWidth}px`,
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
                              left: `${xOffset + (labelWidth - 36) / 2}px`,
                            }}
                          />
                        )}
                        <div
                          className="absolute text-sm font-medium text-center text-foreground"
                          style={{
                            bottom: "0px",
                            left: `${xOffset}px`,
                            width: `${labelWidth}px`,
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
        )
      )}
    </div>
  );
}
