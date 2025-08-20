"use client";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SSRSafe } from "@/components/SSRSafe";

interface StatsTooltipProps {
  tooltipLines: string[];
  children: React.ReactNode;
}

export function StatsTooltip({ tooltipLines, children }: StatsTooltipProps) {
  const fallback = <div className="flex items-center">{children}</div>;

  if (tooltipLines.length === 0) {
    return fallback;
  }

  const tooltipContent = (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center">{children}</div>
      </TooltipTrigger>
      <TooltipContent className="w-fit p-3">
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
          {tooltipLines.map((line) => (
            <React.Fragment key={line}>
              <dt className="text-right font-medium">{line.split(":")[0]}:</dt>
              <dd className="text-left">{line.split(":")[1]}</dd>
            </React.Fragment>
          ))}
        </dl>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <SSRSafe fallback={fallback}>
      {tooltipContent}
    </SSRSafe>
  );
}