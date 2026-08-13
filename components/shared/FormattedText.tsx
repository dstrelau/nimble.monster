"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import MarkdownIt from "markdown-it";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { DiceNotation } from "@/components/dice/DiceNotation";
import { useIsClient } from "@/components/shared/SSRSafe";
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
  isEntityType,
} from "@/lib/types/entity-links";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/slug";

interface FormattedTextProps {
  content: string;
  conditions: ConditionT[];
  className?: string;
  enableHeadings?: boolean;
  blockStyles?: boolean;
  noInteractive?: boolean;
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

function EntityLinkInner({
  type,
  id,
  displayName,
  noInteractive,
}: {
  type: EntityType;
  id: string;
  displayName?: string;
  noInteractive: boolean;
}) {
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
  const href =
    data.href ?? `/${path}/${slugify({ name: data.name, id: data.id })}`;
  const content = (
    <>
      <Icon className="stroke-flame size-3.5" />
      <span>{displayName ?? data.name}</span>
    </>
  );

  if (noInteractive) {
    return (
      <span className="inline-flex items-baseline gap-0.5">{content}</span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-baseline gap-0.5 hover:underline"
    >
      {content}
    </Link>
  );
}

function EntityLink({
  type,
  id,
  displayName,
  queryClient,
  noInteractive,
}: {
  type: EntityType;
  id: string;
  displayName?: string;
  queryClient: QueryClient;
  noInteractive: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <EntityLinkInner
        type={type}
        id={id}
        displayName={displayName}
        noInteractive={noInteractive}
      />
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

    const entityType = state.src.slice(start + 1, colonPos);

    // Validate entity type
    if (!isEntityType(entityType)) {
      return false;
    }

    // Parse ID and optional display name.
    // Formats: @type:ID  or  @type:[ID|Display Text]
    let entityId: string;
    let displayName: string | undefined;
    let finalPos: number;

    if (state.src[colonPos + 1] === "[") {
      // Bracketed form: [ID|Display Text] or [ID]
      const closeBracket = state.src.indexOf("]", colonPos + 2);
      if (closeBracket === -1) return false;
      const inner = state.src.slice(colonPos + 2, closeBracket);
      const pipeIdx = inner.indexOf("|");
      if (pipeIdx === -1) {
        entityId = inner;
      } else {
        entityId = inner.slice(0, pipeIdx);
        displayName = inner.slice(pipeIdx + 1);
      }
      finalPos = closeBracket + 1;
    } else {
      // Plain form: entity ID or official rule slug
      let idEnd = colonPos + 1;
      const idCharacter = entityType === "rule" ? /[a-z0-9-]/ : /[a-z0-9]/;
      while (idEnd < max && state.src[idEnd].match(idCharacter)) {
        idEnd++;
      }
      if (idEnd === colonPos + 1) return false;
      entityId = state.src.slice(colonPos + 1, idEnd);
      finalPos = idEnd;
    }

    if (!silent) {
      const token = state.push("entity_link", "", 0);
      token.meta = {
        entityType,
        entityId,
        displayName,
      };
    }

    state.pos = finalPos;
    return true;
  });

  // Add custom renderer that creates HTML with skeleton placeholder
  md.renderer.rules.entity_link = (tokens, idx) => {
    const token = tokens[idx];
    const meta = token.meta;
    const displayAttr = meta.displayName
      ? ` data-display-name="${meta.displayName}"`
      : "";
    return `<span class="inline-flex items-center gap-1" data-entity-type="${meta.entityType}" data-entity-id="${meta.entityId}"${displayAttr}><span class="bg-muted h-4 w-16 rounded-md animate-pulse"></span></span>`;
  };
}

function listStylePlugin(md: MarkdownIt) {
  md.renderer.rules.bullet_list_open = (tokens, idx, options, _env, self) => {
    tokens[idx].attrJoin("class", "list-disc pl-5");
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.ordered_list_open = (tokens, idx, options, _env, self) => {
    tokens[idx].attrJoin("class", "list-decimal pl-5");
    return self.renderToken(tokens, idx, options);
  };
}

function createMarkdown(enableHeadings = false) {
  const markdown = new MarkdownIt("zero").enable([
    "paragraph",
    "emphasis",
    "newline",
    "list",
    ...(enableHeadings ? ["heading"] : []),
  ]);
  conditionPlugin(markdown);
  diceNotationPlugin(markdown);
  entityLinkPlugin(markdown);
  listStylePlugin(markdown);
  markdown.enable(["text"]);
  return markdown;
}

const md = createMarkdown();
const mdWithHeadings = createMarkdown(true);

export function FormattedText({
  content,
  conditions,
  className = "",
  enableHeadings = false,
  blockStyles = false,
  noInteractive = false,
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
    const markdown = enableHeadings ? mdWithHeadings : md;
    const html = DOMPurify.sanitize(markdown.render(content));

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
      placeholder.textContent = diceText;
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
      const displayName = span.getAttribute("data-display-name") || undefined;

      if (!isEntityType(entityType)) return;

      const placeholderId = `entity-placeholder-${entityIndex}`;
      const placeholder = document.createElement("span");
      placeholder.id = placeholderId;
      span.parentNode?.replaceChild(placeholder, span);

      placeholders.push({
        id: placeholderId,
        component: (
          <EntityLink
            key={`${entityType}-${entityId}-${entityIndex}`}
            type={entityType}
            id={entityId}
            displayName={displayName}
            queryClient={queryClientRef.current}
            noInteractive={noInteractive}
          />
        ),
      });

      entityIndex++;
    });

    return { html: processedDiv.innerHTML, placeholders };
  }, [content, conditions, enableHeadings, isClient, noInteractive]);

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
        "formatted-text [&_p_~_p]:mt-1.5",
        !blockStyles && "formatted-text--inline",
        enableHeadings &&
          "[&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:font-semibold [&_h5]:mt-3 [&_h5]:mb-1 [&_h5]:font-semibold [&_h6]:mt-3 [&_h6]:mb-1 [&_h6]:font-semibold [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_h4:first-child]:mt-0 [&_h5:first-child]:mt-0 [&_h6:first-child]:mt-0",
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
  noInteractive = false,
}: {
  prefix: React.ReactNode;
  content: string;
  conditions: Condition[];
  noInteractive?: boolean;
}) => (
  <div className="overflow-auto">
    <span className="float-left mr-1 flex gap-1">{prefix}</span>
    <FormattedText
      content={content}
      conditions={conditions}
      noInteractive={noInteractive}
    />
  </div>
);
