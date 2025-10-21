import React from "react";

interface DiceStatisticsProps {
  averageRoll: number | null;
  totalAverageRoll: number | null;
  missProbability: number;
}

export function DiceStatistics({
  averageRoll,
  totalAverageRoll,
  missProbability,
}: DiceStatisticsProps) {
  return (
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
  );
}
