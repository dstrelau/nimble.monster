import { Box, Flame } from "lucide-react";
import { D4, D8, D10, D12, D20 } from "@/components/icons/PolyhedralDice";
import type { DieResult } from "@/lib/dice";
import { cn } from "@/lib/utils";

function DiceIcon({
  dieSize,
  className,
}: {
  dieSize: number;
  className?: string;
}) {
  switch (dieSize) {
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
      return <Box className={className} />;
  }
}

function DiceRollResult({ result }: { result: DieResult }) {
  const colorClass = result.isCrit
    ? "text-success"
    : result.isMiss
      ? "text-error"
      : result.type === "vicious"
        ? "text-flame"
        : result.type === "dropped"
          ? "text-muted-foreground"
          : "";

  return (
    <div className="flex flex-col items-center gap-2">
      {result.type === "vicious" ? (
        <Flame className={cn("size-8 md:size-16", colorClass)} />
      ) : (
        <DiceIcon
          dieSize={result.dieSize}
          className={cn("size-8 md:size-16", colorClass)}
        />
      )}
      <span className={cn("text-xl md:text-2xl font-bold", colorClass)}>
        {result.value}
      </span>
    </div>
  );
}

interface DiceRollDisplayProps {
  className?: string;
  results: DieResult[];
  modifier: number;
  total: number;
}

export function DiceRollDisplay({
  className,
  results,
  modifier,
  total,
}: DiceRollDisplayProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-center gap-4 items-center text-xl md:text-4xl font-bold",
        className
      )}
    >
      {results.map((result, index) => (
        <DiceRollResult key={`${result.type}-${index}`} result={result} />
      ))}
      {modifier !== 0 && (
        <span className="flex items-center">
          {modifier > 0 ? "+ " : ""}
          {modifier}
        </span>
      )}
      = {total}
    </div>
  );
}
