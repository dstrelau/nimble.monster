import { Family } from "@/lib/types";
import { AbilityOverlay } from "@/ui/AbilityOverlay";

export default function UserFamilyCard({ family }: { family: Family }) {
  return (
    <div className="d-card d-card-border px-4 py-3 bg-base-100 border-base-300">
      <h2 className="d-card-title font-bold italic text-xl">{family.name}</h2>
      <div className="flex flex-col py-2 gap-4">
        {family.abilities.map((ability) => (
          <AbilityOverlay abilities={[ability]} key={ability.name} />
        ))}
      </div>
      <div className="font-condensed text-sm text-base-content/50">
        {family.monsterCount || 0} monsters
      </div>
    </div>
  );
}
