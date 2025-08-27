"use client";
import DOMPurify from "isomorphic-dompurify";
import MarkdownIt from "markdown-it";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useIsClient } from "@/components/SSRSafe";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Condition as ConditionT } from "@/lib/types";

interface FormattedTextProps {
  content: string;
  conditions: ConditionT[];
  className?: string;
}

function ConditionSpan({
  displayText,
  condition,
  isClient,
}: {
  displayText: string;
  condition: ConditionT | undefined;
  isClient: boolean;
}) {
  if (!isClient || !condition) {
    return (
      <span
        className={`underline decoration-dotted ${
          condition ? "text-primary-success" : "cursor-help"
        }`}
      >
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
function conditionPlugin(md: MarkdownIt, conditions: ConditionT[]) {
  // Add custom inline rule for conditions
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

    const condition = conditions.find(
      (c) => c.name.toLowerCase() === conditionName.toLowerCase()
    );

    if (!silent) {
      const token = state.push("condition", "", 0);
      token.meta = {
        conditionName,
        displayText,
        condition,
      };
    }

    state.pos = pos + 2;
    return true;
  });

  // Add custom renderer that creates HTML markers
  md.renderer.rules.condition = (tokens, idx) => {
    const token = tokens[idx];
    const meta = token.meta;
    return `<span class="condition-marker" data-condition-name="${meta.conditionName}" data-display-text="${meta.displayText}" data-has-condition="${meta.condition ? "true" : "false"}"></span>`;
  };
}

function parseHtmlWithConditions(
  html: string,
  conditions: ConditionT[],
  isClient: boolean
): ReactNode[] {
  const parts: ReactNode[] = [];
  let currentIndex = 0;
  let partKey = 0;

  // Find all condition markers in the HTML
  const markerRegex =
    /<span class="condition-marker" data-condition-name="([^"]*)" data-display-text="([^"]*)" data-has-condition="([^"]*)"><\/span>/g;

  let match = markerRegex.exec(html);
  while (match !== null) {
    // Add HTML before the marker
    const beforeHtml = html.slice(currentIndex, match.index);
    if (beforeHtml.trim()) {
      parts.push(
        <span
          key={`html-${partKey++}`}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
          dangerouslySetInnerHTML={{ __html: beforeHtml }}
        />
      );
    }

    // Add condition component
    const conditionName = match[1];
    const displayText = match[2];
    const condition = conditions.find(
      (c) => c.name.toLowerCase() === conditionName.toLowerCase()
    );

    parts.push(
      <ConditionSpan
        key={`condition-${partKey++}`}
        displayText={displayText}
        condition={condition}
        isClient={isClient}
      />
    );

    currentIndex = match.index + match[0].length;
    match = markerRegex.exec(html);
  }

  // Add remaining HTML
  const remainingHtml = html.slice(currentIndex);
  if (remainingHtml.trim()) {
    parts.push(
      <span
        key={`html-${partKey++}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
        dangerouslySetInnerHTML={{ __html: remainingHtml }}
      />
    );
  }

  return parts.length > 0
    ? parts
    : [
        <span
          key="fallback"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      ];
}

export function FormattedText({
  content,
  conditions,
  className = "",
}: FormattedTextProps) {
  const isClient = useIsClient();

  // Create markdown instance with condition plugin
  const md = useMemo(() => {
    const markdownInstance = new MarkdownIt("zero").enable([
      "paragraph",
      "emphasis",
      "newline",
      "list",
    ]);

    conditionPlugin(markdownInstance, conditions);
    return markdownInstance;
  }, [conditions]);

  const renderedContent = useMemo(() => {
    // Process markdown with conditions
    const html = DOMPurify.sanitize(md.render(content));

    // Check if there are any condition markers
    if (html.includes('class="condition-marker"')) {
      return parseHtmlWithConditions(html, conditions, isClient);
    }

    // Simple case: just return the HTML
    return [
      <div
        key="simple"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
        dangerouslySetInnerHTML={{ __html: html }}
      />,
    ];
  }, [content, conditions, isClient, md]);

  return <div className={className}>{renderedContent}</div>;
}
