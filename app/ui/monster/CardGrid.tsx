import type { Monster } from "@/lib/services/monsters";
import { Card } from "./Card";

export const CardGrid = ({ monsters }: { monsters: Monster[] }) => {
  return (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {monsters.map((m) => {
        return <Card key={m.id} monster={m} creator={m.creator} />;
      })}
    </div>
  );
};
