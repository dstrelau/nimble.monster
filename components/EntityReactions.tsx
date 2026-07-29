"use client";
import { ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReactableEntityType } from "@/lib/db/schema";
import { useEntityReactions } from "@/lib/hooks/useEntityReactions";

interface EntityReactionsProps {
  entityType: ReactableEntityType;
  entityId: string;
  showLabel?: boolean;
}

export function EntityReactions({
  entityType,
  entityId,
  showLabel = false,
}: EntityReactionsProps) {
  const { isAuthenticated, counts, mine, toggle } = useEntityReactions(
    entityType,
    entityId
  );

  if (!isAuthenticated) return null;

  const count = counts?.thumbs_up ?? 0;
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
