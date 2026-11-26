import { ReactionsBatch } from "@/components/ReactionsBatch";
import type { Companion } from "@/lib/types";
import { Card } from "./Card";

interface CardGridProps {
  companions: Companion[];
  hideActions?: boolean;
}

export const CardGrid = ({
  companions,
  hideActions = false,
}: CardGridProps) => {
  return (
    <ReactionsBatch
      pages={[{ entityType: "companion", ids: companions.map((c) => c.id) }]}
    >
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8">
        {companions.map((c) => {
          return (
            <Card
              key={c.id}
              companion={c}
              creator={c.creator}
              hideActions={hideActions}
            />
          );
        })}
      </div>
    </ReactionsBatch>
  );
};
