"use client";
import { Box } from "lucide-react";
import Link from "next/link";
import { parseDiceNotation, simulateRoll } from "nimble-dice";
import { useMemo, useState } from "react";
import { DiceRollDisplay } from "@/components/dice/DiceRollDisplay";
import { DiceStatistics } from "@/components/dice/DiceStatistics";
import { D4, D8, D10, D12, D20 } from "@/components/icons/PolyhedralDice";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDiceStatistics } from "@/lib/hooks/useDiceStatistics";

interface DiceNotationProps {
  text: string;
}

function DiceDrawer({ diceText }: { diceText: string }) {
  const [rollKey, reroll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseDiceNotation(diceText), [diceText]);
  const { stats, pending, showLoading, error } = useDiceStatistics(
    open ? diceText : null
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: rollKey triggers reroll
  const sampleRoll = useMemo(
    () => (open && parsed ? simulateRoll(parsed) : null),
    [open, parsed, rollKey]
  );

  if (!parsed) return <span>{diceText}</span>;

  const dieToIcon = (size: number) => {
    const className = "size-3.5 stroke-flame";
    switch (size) {
      case 4:
        return <D4 className={className} />;
      case 6:
        return <Box className={className} />;
      case 8:
        return <D8 className={className} />;
      case 10:
        return <D10 className={className} />;
      case 12:
        return <D12 className={className} />;
      case 20:
        return <D20 className={className} />;
      default:
        return null;
    }
  };

  const handleReroll = () => {
    setIsRolling(true);
    setTimeout(() => {
      reroll((k) => k + 1);
      setIsRolling(false);
    }, 500);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) handleReroll();
      }}
    >
      <DrawerTrigger asChild>
        <span
          data-dice-notation
          className="inline-flex gap-0.5 items-baseline cursor-pointer hover:text-flame"
        >
          {dieToIcon(parsed.dieSize)}
          {parsed.additionalDice?.length ? (
            diceText
          ) : (
            <>
              {parsed.tensOnes
                ? // Percentile d100 is two d10s; d66 and friends repeat the size.
                  `d${parsed.dieSize === 10 ? 100 : parsed.dieSize.toString().repeat(parsed.numDice)}`
                : `${parsed.numDice}d${parsed.dieSize}`}
              {parsed.modifier > 0
                ? `+${parsed.modifier}`
                : parsed.modifier < 0
                  ? `${parsed.modifier}`
                  : ""}
              {parsed.critModifier !== undefined && `+${parsed.critModifier}c`}
              {parsed.vicious && " (Vicious)"}
              {parsed.advantage === 1
                ? " ADV"
                : parsed.advantage > 0
                  ? ` ADV ${parsed.advantage}`
                  : ""}
              {parsed.disadvantage === 1
                ? " DIS"
                : parsed.disadvantage > 0
                  ? ` DIS ${parsed.disadvantage}`
                  : ""}
            </>
          )}
        </span>
      </DrawerTrigger>
      <DrawerContent>
        <div className="max-w-7xl w-full mx-auto px-8 pb-8">
          <DrawerHeader>
            <DrawerTitle className="text-2xl font-bold text-center">
              {diceText}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-wrap">
            <DiceStatistics
              averageRoll={stats?.averageRoll ?? null}
              totalAverageRoll={stats?.totalAverageRoll ?? null}
              missProbability={stats?.missProbability ?? null}
              pending={pending}
              showLoading={showLoading}
              error={error}
            />
            <DiceRollDisplay
              className="flex-1"
              pending={isRolling}
              results={sampleRoll?.results ?? []}
              modifier={sampleRoll?.modifier ?? 0}
              critModifier={parsed.critModifier}
              total={sampleRoll?.total ?? 0}
            />

            <div className="flex flex-col gap-4">
              <Button
                onClick={handleReroll}
                variant="outline"
                disabled={isRolling}
              >
                Reroll
              </Button>
              <Link href={`/roll?dice=${encodeURIComponent(diceText)}`}>
                <Button className="w-full">View Details</Button>
              </Link>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function DiceNotation({ text }: DiceNotationProps) {
  const diceRegex =
    /\b(\d+d\d+(?:(?:[vadn]\d*)+)?(?:\^-?\d+)?(?:[+-]\d+d\d+)*(?:[+-]\d+(?![\dc]))?(?:\+\d+c)?|d(?:44|66|88|100)(?:[ad]\d*)?)\b/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(diceRegex)) {
    const matchIndex = match.index ?? 0;
    const diceText = match[1];

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const parsed = parseDiceNotation(diceText);
    if (parsed) {
      parts.push(<DiceDrawer key={matchIndex} diceText={diceText} />);
    } else {
      parts.push(diceText);
    }

    lastIndex = matchIndex + diceText.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
