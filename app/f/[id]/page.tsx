import { notFound } from "next/navigation";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const family = await db.getFamily(id);
  const session = await auth();

  if (!family) {
    notFound();
  }

  const monsters = await db.listMonstersByFamilyId(id);

  // Sort monsters by level (accounting for fractional levels like "1/2", "1/3")
  const sortedMonsters = monsters.sort((a, b) => {
    const parseLevel = (level: string): number => {
      if (level.includes("/")) {
        const [numerator, denominator] = level.split("/").map(Number);
        return numerator / denominator;
      }
      return Number(level);
    };

    return parseLevel(a.level) - parseLevel(b.level);
  });

  return (
    <div className="container">
      <div className="flex justify-between items-start mb-6">
        <div className="w-full">
          <h2 className="text-2xl font-bold ">{family.name}</h2>
          {family.abilities && family.abilities.length > 0 && (
            <div className="mt-4 mx-6">
              <AbilityOverlay abilities={family.abilities} />
            </div>
          )}
        </div>
      </div>
      {monsters.length === 0 ? (
        <p>No public monsters in this family.</p>
      ) : (
        <CardGrid
          monsters={sortedMonsters}
          currentUserId={session?.user?.id}
          hideFamilyAbilities={true}
        />
      )}
    </div>
  );
}
