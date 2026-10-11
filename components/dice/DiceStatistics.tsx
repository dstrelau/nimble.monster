import { LoaderCircle } from "lucide-react";
import React from "react";

interface DiceStatisticsProps {
  averageRoll: number | null;
  totalAverageRoll: number | null;
  missProbability: number | null;
  pending?: boolean;
  showLoading?: boolean;
  error?: string | null;
}

export function DiceStatistics({
  averageRoll,
  totalAverageRoll,
  missProbability,
  pending = false,
  showLoading = false,
  error = null,
}: DiceStatisticsProps) {
  if (pending) {
    return showLoading ? (
      <output className="flex items-center justify-center p-4">
        <LoaderCircle
          className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="sr-only">Loading dice statistics</span>
      </output>
    ) : null;
  }
  if (error) {
    return <p role="alert">{error}</p>;
  }
  return (
    <dl>
      {[
        {
          label: "Avg. Damage on Hit",
          value: averageRoll?.toFixed(1) ?? "-",
        },
        {
          label: "Avg. Damage",
          value: totalAverageRoll?.toFixed(1) ?? "-",
        },
        {
          label: "Chance to Miss",
          value:
            missProbability === null
              ? "-"
              : `${(100 * missProbability).toFixed(1)}%`,
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
  );
}
