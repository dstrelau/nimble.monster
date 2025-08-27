"use client";
import type { ReactNode } from "react";
import { useIsClient } from "@/components/SSRSafe";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CONDITION_REGEX } from "@/lib/conditions";
import type { Condition as ConditionT } from "@/lib/types";

interface WithConditionsTooltipsProps {
  text: string | null | undefined;
  conditions: ConditionT[];
}

function ConditionSpan({
  displayText,
  condition,
  isClient,
  keyProp,
}: {
  displayText: string;
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
        {displayText}
      </span>
    );
  }

  // Client-side with known condition - render with tooltip
  return (
    <TooltipProvider key={keyProp}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-primary-success underline decoration-dotted cursor-default">
            {displayText}
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
  const matches = Array.from(text.matchAll(CONDITION_REGEX));
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    // Add text before the match
    if (match.index && match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Parse condition name and display text
    const conditionName = match[1];
    const displayText = match[2] || conditionName; // Use display text if provided, otherwise use condition name
    const condition = conditions.find(
      (c) => c.name.toLowerCase() === conditionName.toLowerCase()
    );

    parts.push(
      <ConditionSpan
        key={`${match.index}-${index}`}
        conditionName={conditionName}
        displayText={displayText}
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

  const matches = Array.from(text.matchAll(CONDITION_REGEX));
  if (matches.length === 0) {
    return text;
  }

  const parts = parseTextWithConditions(text, conditions, isClient);
  return parts.length > 0 ? parts : text;
}
