"use client";

import { RotateCw } from "lucide-react";
import { useMemo, useState } from "react";
import { DiceRollDisplay } from "@/components/dice/DiceRollDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DieResult, RollResult } from "@/lib/dice";
import { parseDiceNotation, simulateRoll } from "@/lib/dice";

function buildRoll(
  dieSize: number,
  values: number[],
  droppedIndices: Set<number>
): RollResult {
  const results: DieResult[] = [];
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const dropped = droppedIndices.has(i);
    if (!dropped) total += values[i];
    results.push({
      value: values[i],
      dieSize,
      type: dropped ? "dropped" : "regular",
      isCrit: false,
      isMiss: false,
    });
  }
  return { results, modifier: 0, primaryMod: 0, total };
}

interface ExampleCardProps {
  initialNotation: string;
  initialRoll: RollResult;
  description: string;
}

function ExampleCard({
  initialNotation,
  initialRoll,
  description,
}: ExampleCardProps) {
  const [rollKey, setRollKey] = useState(0);

  const currentRoll = useMemo(() => {
    if (rollKey === 0) return initialRoll;
    const parsed = parseDiceNotation(initialNotation);
    if (!parsed) return initialRoll;
    return simulateRoll(parsed);
  }, [rollKey, initialNotation, initialRoll]);

  return (
    <Card className="flex-1 min-w-56">
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground text-center">
          {description}
        </p>
        <DiceRollDisplay
          results={currentRoll.results}
          modifier={currentRoll.modifier}
          total={currentRoll.total}
          hideTotal
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRollKey((k) => k + 1)}
        >
          <RotateCw className="size-4" />
          Re-roll
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdvantageDisadvantageExamples() {
  // 2d6a: [1,5,4] — drop index 0 (lowest=1), keep 5+4=9
  const advantageRoll = buildRoll(6, [1, 5, 4], new Set([0]));
  // 2d6d2: [4,1,4,4] — drop indices 0,2 (highest two 4s), keep 1+4=5
  const disadvantageRoll = buildRoll(6, [4, 1, 4, 4], new Set([0, 2]));

  return (
    <div className="not-prose mt-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <ExampleCard
          initialNotation="2d6a"
          initialRoll={advantageRoll}
          description="2d6 with advantage. Roll 1 additional die, and remove the lowest."
        />
        <ExampleCard
          initialNotation="2d6d2"
          initialRoll={disadvantageRoll}
          description="2d6 with disadvantage 2. Roll 2 additional dice, and remove the 2 highest. If there is a tie, always remove dice from left to right."
        />
      </div>
    </div>
  );
}
