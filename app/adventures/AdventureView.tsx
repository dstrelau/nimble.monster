"use client";

import { CircleSlash2 } from "lucide-react";
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
import type { Adventure, AdventureNode } from "@/lib/db/adventures";
import { useConditions } from "@/lib/hooks/useConditions";
import { toHazardMonsterView } from "@/lib/services/hazards/converters";
import type { Condition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdventureViewProps {
  adventure: Pick<Adventure, "name" | "tagline" | "creator" | "nodes">;
}

export const ADVENTURE_SECTION_MARKER_COLORS = [
  "text-orange-700 dark:text-orange-400",
  "text-cyan-700 dark:text-cyan-400",
  "text-emerald-700 dark:text-emerald-400",
  "text-violet-700 dark:text-violet-400",
];

interface SectionMarkerData {
  number: string;
  colorClassName: string;
}

function NodeHeading({
  depth,
  children,
}: {
  depth: number;
  children: React.ReactNode;
}) {
  if (depth === 0) {
    return (
      <h2 className="font-slab text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
        {children}
      </h2>
    );
  }
  if (depth === 1) {
    return (
      <h3 className="font-slab text-xl font-bold leading-tight sm:text-2xl">
        {children}
      </h3>
    );
  }
  return (
    <h4 className="font-slab text-lg font-bold leading-tight sm:text-xl">
      {children}
    </h4>
  );
}

function SectionMarker({ marker }: { marker: SectionMarkerData }) {
  return (
    <div
      data-testid="adventure-section-marker"
      className="flex items-center gap-4"
    >
      <span
        data-testid="adventure-section-marker-number"
        className={cn(
          "font-slab text-base font-bold tracking-[0.08em] tabular-nums sm:text-lg",
          marker.colorClassName
        )}
      >
        {marker.number}
      </span>
      <span
        data-testid="adventure-section-rule"
        aria-hidden="true"
        className="h-px flex-1 bg-border-strong"
      />
    </div>
  );
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

  const sectionMarkers = new Map<string, SectionMarkerData>();
  if (depth === 0) {
    children
      .filter((child) => child.kind === "section")
      .forEach((child, index) => {
        sectionMarkers.set(child.id, {
          number: String(index + 1).padStart(2, "0"),
          colorClassName:
            ADVENTURE_SECTION_MARKER_COLORS[
              index % ADVENTURE_SECTION_MARKER_COLORS.length
            ],
        });
      });
  }

  return (
    <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
      {children.map((child) => (
        <div
          key={child.id}
          id={getAdventureNodeAnchorId(child.id)}
          className={cn(
            child.kind !== "encounter" && "md:col-span-2 xl:col-span-3"
          )}
        >
          <AdventureNodeView
            node={child}
            nodes={nodes}
            depth={depth}
            sectionMarker={sectionMarkers.get(child.id)}
            conditions={conditions}
          />
        </div>
      ))}
    </div>
  );
}

function AdventureNodeView({
  node,
  nodes,
  depth,
  sectionMarker,
  conditions,
}: {
  node: AdventureNode;
  nodes: AdventureNode[];
  depth: number;
  sectionMarker?: SectionMarkerData;
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
          "relative my-2 overflow-hidden border border-l-4 p-0 shadow-sm",
          presentation.panelClassName
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-14 -right-12 size-32 rounded-full border-2 opacity-50",
            presentation.decorationClassName
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-7 -right-4 size-16 rounded-full opacity-40",
            presentation.decorationClassName
          )}
        />
        <div className="relative z-10 p-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                presentation.badgeClassName
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span
              className={cn(
                "font-sans text-[9px] font-bold uppercase tracking-[0.18em]",
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
            <h3 className="mt-1.5 font-slab text-sm font-bold leading-tight sm:text-base">
              {node.title}
            </h3>
          )}
          {content && (
            <div
              className={cn(
                "mt-1.5 text-xs leading-4",
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

  const isSection = node.kind === "section";
  const sectionClassName = cn("space-y-4", depth === 0 ? "mt-12" : "mt-8");

  return (
    <section
      data-adventure-section-depth={isSection ? depth : undefined}
      className={sectionClassName}
    >
      {isSection && depth === 0 && sectionMarker && (
        <SectionMarker marker={sectionMarker} />
      )}
      {isSection && node.title && (
        <NodeHeading depth={depth}>{node.title}</NodeHeading>
      )}
      {content && (
        <div
          className={cn(
            depth === 0
              ? "text-base leading-7 sm:text-lg sm:leading-8"
              : "text-sm leading-6 sm:text-base sm:leading-7"
          )}
        >
          {content}
        </div>
      )}
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
      <header className="text-center">
        <h1 className="font-slab text-3xl font-bold tracking-tight sm:text-4xl">
          {adventure.name.trim() || "Untitled adventure"}
        </h1>
        {adventure.tagline && (
          <p className="mt-3 text-base italic text-muted-foreground">
            {adventure.tagline}
          </p>
        )}
        <Attribution user={adventure.creator} className="mt-3 justify-center" />
        <div
          data-testid="adventure-header-rule"
          aria-hidden="true"
          className="mt-8 border-t-4 border-foreground/70 pt-1"
        >
          <div className="h-px bg-border-strong" />
        </div>
      </header>

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
