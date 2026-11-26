"use client";
import { ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReactableEntityType } from "@/lib/db/schema";
import { useEntityReactions } from "@/lib/hooks/useEntityReactions";
import { cn } from "@/lib/utils";

interface EntityReactionsProps {
  entityType: ReactableEntityType;
  entityId: string;
  likeCount?: number;
  showLabel?: boolean;
}

export function EntityReactions({
  entityType,
  entityId,
  likeCount = 0,
  showLabel = false,
}: EntityReactionsProps) {
  const { isAuthenticated, counts, mine, toggle } = useEntityReactions(
    entityType,
    entityId
  );

  if (!isAuthenticated) {
    return (
      <span
        data-card-export-hide="true"
        className={cn(
          "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-foreground",
          showLabel ? "h-8 text-sm font-medium" : "h-7 text-xs font-bold"
        )}
      >
        <ThumbsUp
          aria-hidden="true"
          className={showLabel ? "size-4" : "order-2 size-5"}
        />
        <span>
          {likeCount}
          <span className={showLabel ? undefined : "sr-only"}>
            {likeCount === 1 ? " like" : " likes"}
          </span>
        </span>
      </span>
    );
  }

  // The stored total shows until the viewer's reactions load.
  const count = counts?.thumbs_up ?? likeCount;
  const reacted = mine.includes("thumbs_up");

  if (showLabel)
    return (
      <Button
        type="button"
        variant={reacted ? "secondary" : "outline"}
        size="sm"
        onClick={() => toggle("thumbs_up")}
        aria-pressed={reacted}
        aria-label={reacted ? "Unlike" : "Like"}
        data-card-export-hide="true"
      >
        <ThumbsUp /> Like{count > 0 && ` ${count}`}
      </Button>
    );

  return (
    <div data-card-export-hide="true" className="flex items-center gap-1">
      <Badge
        variant={reacted ? "reaction-active" : "reaction-inactive"}
        asChild
      >
        <button
          type="button"
          onClick={() => toggle("thumbs_up")}
          aria-pressed={reacted}
          aria-label={reacted ? "Remove upvote" : "Upvote"}
        >
          {count > 0 && count}
          <ThumbsUp className="size-5" />
        </button>
      </Badge>
    </div>
  );
}
