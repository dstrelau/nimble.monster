"use client";
import DOMPurify from "isomorphic-dompurify";

import MarkdownIt from "markdown-it";
import { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useIsClient } from "@/components/SSRSafe";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Condition, Condition as ConditionT } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FormattedTextProps {
  content: string;
  conditions: ConditionT[];
  className?: string;
}

function ConditionSpan({
  displayText,
  condition,
}: {
  displayText: string;
  condition: ConditionT | undefined;
}) {
  if (!condition) {
    return (
      <span className="underline decoration-dotted cursor-help">
        {displayText}
      </span>
    );
  }

  return (
    <TooltipProvider>
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

// Custom markdown-it plugin for condition parsing
function conditionPlugin(md: MarkdownIt) {
  md.inline.ruler.before("emphasis", "condition", (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    // Check for [[ at current position
    if (start + 2 >= max || state.src.slice(start, start + 2) !== "[[") {
      return false;
    }

    // Find the closing ]]
    let pos = start + 2;
    let foundEnd = false;

    while (pos < max - 1) {
      if (state.src.slice(pos, pos + 2) === "]]") {
        foundEnd = true;
        break;
      }
      pos++;
    }

    if (!foundEnd) {
      return false;
    }

    // Extract condition content
    const conditionContent = state.src.slice(start + 2, pos);
    const pipeIndex = conditionContent.indexOf("|");

    const conditionName =
      pipeIndex >= 0 ? conditionContent.slice(0, pipeIndex) : conditionContent;
    const displayText =
      pipeIndex >= 0 ? conditionContent.slice(pipeIndex + 1) : conditionName;

    if (!silent) {
      const token = state.push("condition", "", 0);
      token.meta = {
        conditionName,
        displayText,
        // condition,
      };
    }

    state.pos = pos + 2;
    return true;
  });

  // Add custom renderer that creates HTML markers
  md.renderer.rules.condition = (tokens, idx) => {
    const token = tokens[idx];
    const meta = token.meta;
    return `<span class="underline decoration-dotted" data-condition-name="${meta.conditionName}" data-display-text="${meta.displayText}" data-has-condition="${meta.condition ? "true" : "false"}">${meta.conditionName}</span>`;
  };
}

export function FormattedText({
  content,
  conditions,
  className = "",
}: FormattedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  // Create markdown instance with condition plugin
  const md = useMemo(() => {
    const markdownInstance = new MarkdownIt("zero").enable([
      "paragraph",
      "emphasis",
      "newline",
      "list",
    ]);

    conditionPlugin(markdownInstance);
    return markdownInstance;
  }, []);

  const renderedContent = useMemo(() => {
    // Process markdown with conditions
    const html = DOMPurify.sanitize(md.render(content));

    // Always return the HTML with data attributes
    return (
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }, [content, md]);

  // Hydrate condition spans after client-side render
  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const conditionSpans = containerRef.current.querySelectorAll(
      "[data-condition-name]"
    );

    conditionSpans.forEach((span) => {
      const conditionName = span.getAttribute("data-condition-name");
      const displayText = span.getAttribute("data-display-text");

      if (!conditionName || !displayText) return;

      const condition = conditions.find(
        (c) => c.name.toLowerCase() === conditionName.toLowerCase()
      );

      // Create a container for the React component
      const container = document.createElement("span");
      span.parentNode?.replaceChild(container, span);

      // Render the ConditionSpan component
      const root = createRoot(container);
      root.render(
        <ConditionSpan displayText={displayText} condition={condition} />
      );
    });
  }, [isClient, conditions]);

  return (
    <div ref={containerRef} className={cn("[&_p_~_p]:mt-1.5", className)}>
      {renderedContent}
    </div>
  );
}

export const PrefixedFormattedText = ({
  prefix,
  content,
  conditions,
}: {
  prefix: React.ReactNode;
  content: string;
  conditions: Condition[];
}) => (
  <div className="flex gap-1">
    <span className="flex gap-1 flex-shrink-0">{prefix}</span>
    <FormattedText content={content} conditions={conditions} />
  </div>
);
