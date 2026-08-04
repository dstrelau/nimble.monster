import { cn } from "@/lib/utils";

export interface AdventureOutlineNode {
  id: string;
  parentId: string | null;
  orderIndex: number;
  label: string;
}

export const ADVENTURE_SECTION_COLORS = [
  {
    dot: "bg-orange-700 dark:bg-orange-400",
    border: "border-l-orange-700 dark:border-l-orange-400",
  },
  {
    dot: "bg-cyan-700 dark:bg-cyan-400",
    border: "border-l-cyan-700 dark:border-l-cyan-400",
  },
  {
    dot: "bg-violet-700 dark:bg-violet-400",
    border: "border-l-violet-700 dark:border-l-violet-400",
  },
  {
    dot: "bg-emerald-700 dark:bg-emerald-400",
    border: "border-l-emerald-700 dark:border-l-emerald-400",
  },
  {
    dot: "bg-rose-700 dark:bg-rose-400",
    border: "border-l-rose-700 dark:border-l-rose-400",
  },
  {
    dot: "bg-amber-700 dark:bg-amber-400",
    border: "border-l-amber-700 dark:border-l-amber-400",
  },
] as const;

export function getAdventureNodeAnchorId(nodeId: string) {
  return `adventure-node-${nodeId}`;
}

interface AdventureOutlineProps {
  nodes: AdventureOutlineNode[];
  className?: string;
}

export function AdventureOutline({ nodes, className }: AdventureOutlineProps) {
  const childrenByParent = new Map<string | null, AdventureOutlineNode[]>();
  for (const node of nodes) {
    const children = childrenByParent.get(node.parentId) ?? [];
    children.push(node);
    childrenByParent.set(node.parentId, children);
  }
  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  const renderChildren = (
    parentId: string | null,
    depth: number,
    topLevelIndex = 0
  ): React.ReactNode =>
    (childrenByParent.get(parentId) ?? []).map((node, index) => {
      const colorIndex = depth === 0 ? index : topLevelIndex;
      const children = childrenByParent.get(node.id) ?? [];
      return (
        <li key={node.id} className="space-y-1">
          <div className="flex min-w-0 items-center justify-start gap-1">
            {depth === 0 && (
              <span
                className={cn(
                  "mr-1 size-2 shrink-0 rounded-full",
                  ADVENTURE_SECTION_COLORS[
                    colorIndex % ADVENTURE_SECTION_COLORS.length
                  ].dot
                )}
              />
            )}
            <a
              href={`#${getAdventureNodeAnchorId(node.id)}`}
              className={cn(
                "min-w-0 break-words hover:text-foreground",
                depth === 0
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {node.label}
            </a>
          </div>
          {children.length > 0 && (
            <ol className={cn("space-y-1", depth === 0 ? "ml-4" : "ml-5")}>
              {renderChildren(node.id, depth + 1, colorIndex)}
            </ol>
          )}
        </li>
      );
    });

  return (
    <nav aria-label="Adventure outline" className={className}>
      <p className="mb-4 font-bold text-muted-foreground text-sm uppercase tracking-widest">
        Outline
      </p>
      <ol className="space-y-2">{renderChildren(null, 0)}</ol>
    </nav>
  );
}
