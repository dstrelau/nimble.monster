"use client";

import { CircleSlash2 } from "lucide-react";
import { Fragment } from "react";
import {
  getAdventureCalloutPresentation,
  normalizeAdventureCalloutPresentation,
} from "@/app/adventures/calloutPresentations";
import { getAdventureNodeAnchorId } from "@/components/adventure/AdventureOutline";
import { EncounterCard } from "@/components/encounter/EncounterCard";
import { Card as ItemCard } from "@/components/item/Card";
import { Card as MonsterCard } from "@/components/monster/Card";
import { Attribution } from "@/components/shared/Attribution";
import { FormattedText } from "@/components/shared/FormattedText";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Adventure, AdventureNode } from "@/lib/db/adventures";
import { useConditions } from "@/lib/hooks/useConditions";
import { toHazardMonsterView } from "@/lib/services/hazards/converters";
import type { Condition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdventureViewProps {
  adventure: Pick<
    Adventure,
    "name" | "tagline" | "summary" | "creator" | "nodes"
  >;
}

function NodeHeading({
  depth,
  children,
}: {
  depth: number;
  children: React.ReactNode;
}) {
  if (depth === 0) {
    return <h2 className="text-2xl font-bold">{children}</h2>;
  }
  if (depth === 1) {
    return <h3 className="text-xl font-semibold">{children}</h3>;
  }
  return <h4 className="text-lg font-semibold">{children}</h4>;
}

function RemovedContent() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-muted-foreground">
      <CircleSlash2 className="size-5" />
      Removed content
    </div>
  );
}

function AdventureNodeList({
  nodes,
  parentId,
  depth,
  conditions,
}: {
  nodes: AdventureNode[];
  parentId: string | null;
  depth: number;
  conditions: Condition[];
}) {
  const children = nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  if (children.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-3">
      {children.map((child, index) => (
        <Fragment key={child.id}>
          {depth === 0 && index > 0 && (
            <Separator className="col-span-full mx-auto my-4 data-[orientation=horizontal]:w-1/2" />
          )}
          <div
            id={getAdventureNodeAnchorId(child.id)}
            className={cn(
              child.kind !== "encounter" && "md:col-span-2 xl:col-span-3",
              depth === 0 && index > 0 && "[&>section]:mt-0"
            )}
          >
            <AdventureNodeView
              node={child}
              nodes={nodes}
              depth={depth}
              conditions={conditions}
            />
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function AdventureNodeView({
  node,
  nodes,
  depth,
  conditions,
}: {
  node: AdventureNode;
  nodes: AdventureNode[];
  depth: number;
  conditions: Condition[];
}) {
  const children = nodes
    .filter((candidate) => candidate.parentId === node.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const content = node.content.trim() ? (
    <FormattedText content={node.content} conditions={conditions} />
  ) : null;

  if (node.kind === "callout") {
    const presentation = getAdventureCalloutPresentation(node.presentation);
    const Icon = presentation.Icon;

    return (
      <Card
        data-callout-presentation={normalizeAdventureCalloutPresentation(
          node.presentation
        )}
        data-testid="adventure-callout"
        className={cn(
          "relative my-4 overflow-hidden border border-l-4 p-0 shadow-sm",
          presentation.panelClassName
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-20 -right-16 size-44 rounded-full border-2 opacity-50",
            presentation.decorationClassName
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-10 -right-6 size-24 rounded-full opacity-40",
            presentation.decorationClassName
          )}
        />
        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                presentation.badgeClassName
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span
              className={cn(
                "font-sans text-sm font-bold uppercase tracking-[0.24em]",
                presentation.accentClassName
              )}
            >
              {presentation.label}
            </span>
            <span
              aria-hidden="true"
              className={cn("h-px min-w-6 flex-1", presentation.ruleClassName)}
            />
          </div>
          {node.title && (
            <h3 className="mt-5 font-slab text-2xl font-bold leading-tight sm:text-3xl">
              {node.title}
            </h3>
          )}
          {content && (
            <div
              className={cn(
                "mt-4 text-base leading-8 sm:text-lg",
                presentation.accentClassName
              )}
            >
              {content}
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (node.kind === "encounter") {
    return (
      <section className="my-4 space-y-4">
        {node.encounter && <EncounterCard encounter={node.encounter} />}
        {node.referenceRemoved && <RemovedContent />}
        {children.length > 0 && (
          <AdventureNodeList
            nodes={nodes}
            parentId={node.id}
            depth={depth + 1}
            conditions={conditions}
          />
        )}
      </section>
    );
  }

  if (node.kind === "statblock") {
    return (
      <section className={cn("space-y-4", depth === 0 ? "mt-10" : "mt-6")}>
        {node.statblock?.entityType === "monster" && (
          <div className="mx-auto w-full max-w-2xl">
            <MonsterCard
              monster={
                node.statblock.entity.hazard
                  ? toHazardMonsterView(node.statblock.entity)
                  : node.statblock.entity
              }
              creator={node.statblock.entity.creator}
              hideActions
            />
          </div>
        )}
        {node.statblock?.entityType === "item" && (
          <div className="mx-auto w-full max-w-sm">
            <ItemCard
              item={node.statblock.entity}
              creator={node.statblock.entity.creator}
              hideActions
            />
          </div>
        )}
        {node.referenceRemoved && <RemovedContent />}
        {children.length > 0 && (
          <AdventureNodeList
            nodes={nodes}
            parentId={node.id}
            depth={depth + 1}
            conditions={conditions}
          />
        )}
      </section>
    );
  }

  return (
    <section className="space-y-1 mt-4">
      {node.kind === "section" && node.title && (
        <NodeHeading depth={depth}>{node.title}</NodeHeading>
      )}
      {content}
      {children.length > 0 && (
        <AdventureNodeList
          nodes={nodes}
          parentId={node.id}
          depth={depth + 1}
          conditions={conditions}
        />
      )}
    </section>
  );
}

export function AdventureView({ adventure }: AdventureViewProps) {
  const { allConditions: conditions, isLoading: conditionsLoading } =
    useConditions({
      creatorId: adventure.creator.discordId,
    });
  const roots = adventure.nodes
    .filter((node) => node.parentId === null)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  return (
    <article>
      <header className="border-b pb-8 text-center">
        <h1 className="font-slab text-4xl font-bold tracking-tight sm:text-5xl">
          {adventure.name.trim() || "Untitled adventure"}
        </h1>
        {adventure.tagline && (
          <p className="mt-3 text-lg italic text-muted-foreground">
            {adventure.tagline}
          </p>
        )}
        <Attribution user={adventure.creator} className="mt-3 justify-center" />
      </header>

      {adventure.summary && (
        <p className="mt-8 text-lg leading-relaxed">{adventure.summary}</p>
      )}

      {roots.length > 0 ? (
        <AdventureNodeList
          key={conditionsLoading ? "conditions-loading" : "conditions-ready"}
          nodes={adventure.nodes}
          parentId={null}
          depth={0}
          conditions={conditionsLoading ? [] : conditions}
        />
      ) : (
        <p className="mt-10 text-muted-foreground">
          This adventure does not have any sections yet.
        </p>
      )}
    </article>
  );
}
