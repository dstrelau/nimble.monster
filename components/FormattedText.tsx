"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import MarkdownIt from "markdown-it";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { DiceNotation } from "@/components/DiceNotation";
import { useIsClient } from "@/components/SSRSafe";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEntityQuery } from "@/lib/hooks/useEntityQuery";
import type { Condition, Condition as ConditionT } from "@/lib/types";
import {
  ENTITY_TYPE_ICONS,
  ENTITY_TYPE_PATHS,
  type EntityType,
} from "@/lib/types/entity-links";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/slug";

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

function EntityLinkInner({ type, id }: { type: EntityType; id: string }) {
  const { data, isLoading, isError } = useEntityQuery(type, id);

  const Icon = ENTITY_TYPE_ICONS[type];
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1">
        <Icon className="stroke-flame size-4" />
        <Skeleton className="bg-muted h-4 w-18" />
      </span>
    );
  }

  if (isError || !data) {
    return <span className="text-muted-foreground">{id}</span>;
  }

  const path = ENTITY_TYPE_PATHS[type];
  const slug = slugify({ name: data.name, id: data.id });

  return (
    <Link
      href={`/${path}/${slug}`}
      className="inline-flex items-baseline gap-0.5 hover:underline"
    >
      <Icon className="stroke-flame size-3.5" />
      <span>{data.name}</span>
    </Link>
  );
}

function EntityLink({
  type,
  id,
  queryClient,
}: {
  type: EntityType;
  id: string;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <EntityLinkInner type={type} id={id} />
    </QueryClientProvider>
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

// Custom markdown-it plugin for dice notation parsing
function diceNotationPlugin(md: MarkdownIt) {
  function splitTextToken(
    text: string,
    // biome-ignore lint/suspicious/noExplicitAny: markdown-it Token constructor type is not exported
    Token: any
  ) {
    const diceRegex =
      /(\d+d\d+(?:[vad]\d*)?(?:[+-]\d+)?|d(?:44|66|88)(?:[ad]\d*)?)/gi;
    const result = [];
    let lastIndex = 0;

    let match = diceRegex.exec(text);
    while (match !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        const textToken = new Token("text", "", 0);
        textToken.content = text.slice(lastIndex, match.index);
        result.push(textToken);
      }

      // Add dice token
      const diceToken = new Token("dice", "", 0);
      diceToken.meta = { diceText: match[1] };
      result.push(diceToken);

      lastIndex = match.index + match[1].length;
      match = diceRegex.exec(text);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const textToken = new Token("text", "", 0);
      textToken.content = text.slice(lastIndex);
      result.push(textToken);
    }

    return result;
  }

  md.core.ruler.after("inline", "dice", (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
      if (state.tokens[i].type !== "inline") continue;

      const blockToken = state.tokens[i];
      if (!blockToken.children) continue;

      const newChildren = [];

      for (let j = 0; j < blockToken.children.length; j++) {
        const token = blockToken.children[j];
        if (token.type === "text") {
          const split = splitTextToken(token.content, state.Token);
          newChildren.push(...split);
        } else {
          newChildren.push(token);
        }
      }

      blockToken.children = newChildren;
    }
  });

  // Add custom renderer that creates HTML markers
  md.renderer.rules.dice = (tokens, idx) => {
    const token = tokens[idx];
    const meta = token.meta;
    return `<span data-dice-text="${meta.diceText}">${meta.diceText}</span>`;
  };
}

// Custom markdown-it plugin for entity link parsing
function entityLinkPlugin(md: MarkdownIt) {
  md.inline.ruler.before("emphasis", "entity_link", (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    // Check for @ at current position
    if (start + 1 >= max || state.src[start] !== "@") {
      return false;
    }

    // Find the colon separator
    let colonPos = -1;
    let endPos = start + 1;

    while (endPos < max) {
      const char = state.src[endPos];
      if (char === ":") {
        colonPos = endPos;
        break;
      }
      if (!char.match(/[a-z-]/)) {
        return false;
      }
      endPos++;
    }

    if (colonPos === -1) {
      return false;
    }

    // Find the end of the ID (alphanumeric only)
    let idEnd = colonPos + 1;
    while (idEnd < max && state.src[idEnd].match(/[a-z0-9]/)) {
      idEnd++;
    }

    if (idEnd === colonPos + 1) {
      return false;
    }

    const entityType = state.src.slice(start + 1, colonPos);
    const entityId = state.src.slice(colonPos + 1, idEnd);

    // Validate entity type
    const validTypes = [
      "monster",
      "item",
      "companion",
      "family",
      "collection",
      "school",
      "subclass",
      "ancestry",
      "background",
    ];
    if (!validTypes.includes(entityType)) {
      return false;
    }

    if (!silent) {
      const token = state.push("entity_link", "", 0);
      token.meta = {
        entityType,
        entityId,
      };
    }

    state.pos = idEnd;
    return true;
  });

  // Add custom renderer that creates HTML with skeleton placeholder
  md.renderer.rules.entity_link = (tokens, idx) => {
    const token = tokens[idx];
    const meta = token.meta;
    return `<span class="inline-flex items-center gap-1" data-entity-type="${meta.entityType}" data-entity-id="${meta.entityId}"><span class="bg-muted h-4 w-16 rounded-md animate-pulse"></span></span>`;
  };
}

const md = new MarkdownIt("zero").enable([
  "paragraph",
  "emphasis",
  "newline",
  "list",
]);
conditionPlugin(md);
diceNotationPlugin(md);
entityLinkPlugin(md);
md.enable(["text"]);

export function FormattedText({
  content,
  conditions,
  className = "",
}: FormattedTextProps) {
  const isClient = useIsClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClientRef = useRef<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60000,
        },
      },
    })
  );

  const { html, placeholders } = useMemo(() => {
    const html = DOMPurify.sanitize(md.render(content));

    if (!isClient) {
      return { html, placeholders: [] };
    }

    // Create a new div to hold the processed content
    const processedDiv = document.createElement("div");
    processedDiv.innerHTML = html;

    const placeholders: { id: string; component: React.ReactNode }[] = [];

    // Replace each condition span with a placeholder
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

    // Replace each dice span with a placeholder
    let diceIndex = 0;
    processedDiv.querySelectorAll("[data-dice-text]").forEach((span) => {
      const diceText = span.getAttribute("data-dice-text") || "";

      const placeholderId = `dice-placeholder-${diceIndex}`;
      const placeholder = document.createElement("span");
      placeholder.id = placeholderId;
      span.parentNode?.replaceChild(placeholder, span);

      placeholders.push({
        id: placeholderId,
        component: (
          <DiceNotation key={`${diceText}-${diceIndex}`} text={diceText} />
        ),
      });

      diceIndex++;
    });

    // Replace each entity link span with a placeholder
    let entityIndex = 0;
    processedDiv.querySelectorAll("[data-entity-type]").forEach((span) => {
      const entityType = span.getAttribute("data-entity-type") || "";
      const entityId = span.getAttribute("data-entity-id") || "";

      const placeholderId = `entity-placeholder-${entityIndex}`;
      const placeholder = document.createElement("span");
      placeholder.id = placeholderId;
      span.parentNode?.replaceChild(placeholder, span);

      placeholders.push({
        id: placeholderId,
        component: (
          <EntityLink
            key={`${entityType}-${entityId}-${entityIndex}`}
            type={entityType as EntityType}
            id={entityId}
            queryClient={queryClientRef.current}
          />
        ),
      });

      entityIndex++;
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
