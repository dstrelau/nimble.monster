"use client";
import { Box } from "lucide-react";
import Link from "next/link";
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
import {
  calculateAverageDamageOnHit,
  calculateProbabilityDistribution,
  calculateTotalAverageDamage,
  parseDiceNotation,
  simulateRoll,
} from "@/lib/dice";

interface DiceNotationProps {
  text: string;
}

function DiceDrawer({ diceText }: { diceText: string }) {
  const [rollKey, reroll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const parsed = parseDiceNotation(diceText);

  const distribution = useMemo(
    () => (parsed ? calculateProbabilityDistribution(parsed) : null),
    [parsed]
  );
  const averageRoll = useMemo(
    () => (distribution ? calculateAverageDamageOnHit(distribution) : 0),
    [distribution]
  );
  const totalAverageRoll = useMemo(
    () => (distribution ? calculateTotalAverageDamage(distribution) : 0),
    [distribution]
  );
  const missProbability = useMemo(
    () => distribution?.get(0) || 0,
    [distribution]
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: rollKey triggers reroll
  const sampleRoll = useMemo(
    () => (parsed ? simulateRoll(parsed) : null),
    [parsed, rollKey]
  );

  if (!parsed || !sampleRoll) return <span>{diceText}</span>;

  const dieToIcon = (size: number) => {
    const className = "size-4 stroke-flame";
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
    <Drawer onOpenChange={(open) => open && handleReroll()}>
      <DrawerTrigger asChild>
        <span className="inline-flex items-center cursor-pointer">
          {dieToIcon(parsed.dieSize)}
          {diceText}
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
              averageRoll={averageRoll}
              totalAverageRoll={totalAverageRoll}
              missProbability={missProbability}
            />
            <DiceRollDisplay
              className="flex-1"
              pending={isRolling}
              results={sampleRoll.results}
              modifier={sampleRoll.modifier}
              total={sampleRoll.total}
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
  const diceRegex = /\b(\d+d\d+(?:[vad]\d*)?(?:[+-]\d+)?)\b/gi;
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
