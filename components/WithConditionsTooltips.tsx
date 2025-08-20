"use client";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsClient } from "@/components/SSRSafe";
import type { Condition as ConditionT } from "@/lib/types";

interface WithConditionsTooltipsProps {
  text: string | null | undefined;
  conditions: ConditionT[];
}

function ConditionSpan({
  conditionName,
  condition,
  isClient,
  keyProp,
}: {
  conditionName: string;
  condition: ConditionT | undefined;
  isClient: boolean;
  keyProp: string;
}) {
  // During SSR or for unknown conditions, render simple span
  if (!isClient || !condition) {
    return (
      <span
        key={keyProp}
        className={`underline decoration-dotted ${
          condition ? "text-primary-success" : "cursor-help"
        }`}
      >
        {conditionName}
      </span>
    );
  }

  // Client-side with known condition - render with tooltip
  return (
    <TooltipProvider key={keyProp}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-primary-success underline decoration-dotted cursor-default">
            {condition.name}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-3xs text-wrap">
          <strong>{condition.name}:</strong> {condition.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function parseTextWithConditions(
  text: string,
  conditions: ConditionT[],
  isClient: boolean
): ReactNode[] {
  const matches = Array.from(text.matchAll(/\[\[([^\]]+)\]\]/g));
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    // Add text before the match
    if (match.index && match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the condition span
    const conditionName = match[1];
    const condition = conditions.find((c) => c.name === conditionName);

    parts.push(
      <ConditionSpan
        key={`${match.index}-${index}`}
        conditionName={conditionName}
        condition={condition}
        isClient={isClient}
        keyProp={`${match.index}-${index}`}
      />
    );

    if (match.index !== undefined) {
      lastIndex = match.index + match[0].length;
    }
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function WithConditionsTooltips({
  text,
  conditions,
}: WithConditionsTooltipsProps) {
  const isClient = useIsClient();

  if (!text) {
    return null;
  }

  const matches = Array.from(text.matchAll(/\[\[([^\]]+)\]\]/g));
  if (matches.length === 0) {
    return text;
  }

  const parts = parseTextWithConditions(text, conditions, isClient);
  return parts.length > 0 ? parts : text;
}
