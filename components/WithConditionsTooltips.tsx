import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Condition as ConditionT } from "@/lib/types";

interface WithConditionsTooltipsProps {
  text: string | null | undefined;
  conditions: ConditionT[];
}

export function WithConditionsTooltips({
  text,
  conditions,
}: WithConditionsTooltipsProps) {
  if (!text) {
    return null;
  }

  const matches = Array.from(text.matchAll(/\[\[([^\]]+)\]\]/g));

  if (matches.length === 0) {
    return text;
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    if (match.index !== undefined && match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const conditionName = match[1];
    const condition = conditions.find((c) => c.name === conditionName);
    if (!condition) {
      parts.push(
        <span
          key={`${match.index}-${index}`}
          className="underline decoration-dotted cursor-help"
        >
          {conditionName}
        </span>
      );
    } else {
      parts.push(
        <TooltipProvider key={`${match.index}-${index}`}>
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

    if (match.index !== undefined) {
      lastIndex = match.index + match[0].length;
    }
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
