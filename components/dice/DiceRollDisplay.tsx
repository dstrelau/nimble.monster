import { Box, Flame } from "lucide-react";
import React from "react";
import { D4, D8, D10, D12, D20 } from "@/components/icons/PolyhedralDice";
import type { DieResult } from "@/lib/dice";
import { cn } from "@/lib/utils";

function DiceIcon({
  dieSize,
  className,
  style,
}: {
  dieSize: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  switch (dieSize) {
    case 4:
      return <D4 className={className} style={style} />;
    case 6:
      return <Box className={className} style={style} />;
    case 8:
      return <D8 className={className} style={style} />;
    case 10:
      return <D10 className={className} style={style} />;
    case 12:
      return <D12 className={className} style={style} />;
    case 20:
      return <D20 className={className} style={style} />;
    default:
      return <Box className={className} style={style} />;
  }
}

function DiceRollResult({
  result,
  pending,
}: {
  result: DieResult;
  pending?: boolean;
}) {
  const [randomValue, setRandomValue] = React.useState(
    Math.floor(Math.random() * result.dieSize) + 1
  );

  React.useEffect(() => {
    if (!pending) return;
    const interval = setInterval(() => {
      setRandomValue(Math.floor(Math.random() * result.dieSize) + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [pending, result.dieSize]);

  const colorClass = result.isCrit
    ? "text-success"
    : result.isMiss
      ? "text-error"
      : result.type === "vicious"
        ? "text-flame"
        : result.type === "dropped"
          ? "text-muted-foreground"
          : "";
  if (pending && (result.type === "vicious" || result.type === "explosion")) {
    return null;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      {result.type === "vicious" ? (
        <Flame className={cn("size-8 md:size-16", pending ? "" : colorClass)} />
      ) : (
        <DiceIcon
          dieSize={result.dieSize}
          className={cn("size-8 md:size-16", pending ? "" : colorClass)}
        />
      )}
      <span
        className={cn(
          "text-xl md:text-2xl font-bold",
          pending ? "" : colorClass
        )}
      >
        {pending ? randomValue : result.value}
      </span>
    </div>
  );
}

interface DiceRollDisplayProps {
  className?: string;
  pending?: boolean;
  results: DieResult[];
  modifier: number;
  total: number;
}

export function DiceRollDisplay({
  className,
  pending,
  results,
  modifier,
  total,
}: DiceRollDisplayProps) {
  const sortedResults = results
    .map((result, index) => ({ result, index }))
    .sort((a, b) => {
      const order = {
        primary: 0,
        regular: 1,
        dropped: 1,
        explosion: 2,
        vicious: 3,
      };
      const orderDiff = order[a.result.type] - order[b.result.type];
      return orderDiff !== 0 ? orderDiff : a.index - b.index;
    })
    .map(({ result }) => result);

  return (
    <div
      className={cn(
        "flex flex-wrap justify-center gap-4 items-center text-xl md:text-4xl font-bold",
        className
      )}
    >
      {sortedResults.map((result, index) => (
        <DiceRollResult
          key={`${result.type}-${index}`}
          result={result}
          pending={pending}
        />
      ))}
      {modifier !== 0 && (
        <span className="flex items-center">
          {modifier > 0 ? "+ " : ""}
          {modifier}
        </span>
      )}
      <span className="min-w-18">= {pending ? "  " : total}</span>
    </div>
  );
}
