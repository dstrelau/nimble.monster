import { notFound } from "next/navigation";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { FamilyHeaderWithDelete } from "./DeleteButton";
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

  const isCreator = session?.user?.id === family.creatorId;

  return (
    <div className="container">
      <FamilyHeaderWithDelete
        family={family}
        showEditButton={isCreator}
        editHref={`/f/${id}/edit`}
      />
      {monsters.length === 0 ? (
        <p>No public monsters in this family.</p>
      ) : (
        <CardGrid
          monsters={sortedMonsters}
          currentUserId={session?.user?.id}
          hideFamilyAbilities={true}
          hideCreator={true}
          hideFamilyName={true}
        />
      )}
    </div>
  );
}
