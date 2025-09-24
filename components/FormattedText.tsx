"use client";
import DOMPurify from "isomorphic-dompurify";
import MarkdownIt from "markdown-it";
import { useLayoutEffect, useMemo, useRef } from "react";
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

  const text = (
    <span className="underline decoration-dotted cursor-default">
      {displayText}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{text}</TooltipTrigger>
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
      };
    }

    state.pos = pos + 2;
    return true;
  });

  // Add custom renderer that creates HTML markers
  md.renderer.rules.condition = (tokens, idx) => {
    const token = tokens[idx];
    const meta = token.meta;
    return `<span class="underline decoration-dotted" data-condition-name="${meta.conditionName}" data-display-text="${meta.displayText}">${meta.displayText}</span>`;
  };
}

const md = new MarkdownIt("zero").enable([
  "paragraph",
  "emphasis",
  "newline",
  "list",
]);
conditionPlugin(md);

export function FormattedText({
  content,
  conditions,
  className = "",
}: FormattedTextProps) {
  const isClient = useIsClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const { html, placeholders } = useMemo(() => {
    const html = DOMPurify.sanitize(md.render(content));

    if (!isClient) {
      return { html, placeholders: [] };
    }

    // Parse HTML and replace condition spans with React components
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const conditionSpans = doc.querySelectorAll("[data-condition-name]");

    if (conditionSpans.length === 0) {
      return { html, placeholders: [] };
    }

    // Create a new div to hold the processed content
    const processedDiv = document.createElement("div");
    processedDiv.innerHTML = html;

    // Replace each condition span with a placeholder
    const placeholders: { id: string; component: React.ReactNode }[] = [];
    processedDiv
      .querySelectorAll("[data-condition-name]")
      .forEach((span, index) => {
        const conditionName = span.getAttribute("data-condition-name") || "";
        const displayText =
          span.getAttribute("data-display-text") || conditionName;
        const condition = conditions.find(
          (c) => c.name.toLowerCase() === conditionName.toLowerCase()
        );

        const placeholderId = `condition-placeholder-${index}`;
        const placeholder = document.createElement("span");
        placeholder.id = placeholderId;
        span.parentNode?.replaceChild(placeholder, span);

        placeholders.push({
          id: placeholderId,
          component: (
            <ConditionSpan
              key={condition?.name}
              displayText={displayText}
              condition={condition}
            />
          ),
        });
      });

    return { html: processedDiv.innerHTML, placeholders };
  }, [content, conditions, isClient]);

  useLayoutEffect(() => {
    if (!containerRef.current || placeholders.length === 0) return;

    placeholders.forEach(({ id, component }) => {
      const placeholder = containerRef.current?.querySelector(`#${id}`);
      if (placeholder) {
        const reactContainer = document.createElement("span");
        // Copy the text content before replacing to avoid flicker
        reactContainer.textContent = placeholder.textContent;
        placeholder.parentNode?.replaceChild(reactContainer, placeholder);
        const root = createRoot(reactContainer);
        root.render(component);
      }
    });
  }, [placeholders]);

  const renderedContent =
    placeholders.length > 0 ? (
      <div
        ref={containerRef}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized and processed markdown content
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ) : (
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );

  return (
    <div
      className={cn(
        "[&_p_~_p]:mt-1.5 [&_ul,&_li]:list-disc [&_ul,&_li]:list-inside",
        className
      )}
    >
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
  <div className="overflow-auto">
    <span className="float-left mr-1 flex gap-1">{prefix}</span>
    <FormattedText content={content} conditions={conditions} />
  </div>
);
