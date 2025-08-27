import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadOfficialConditions } from "@/app/actions/conditions";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { FamilyHeader } from "@/components/FamilyHeader";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { listConditionsForDiscordId } from "@/lib/db/condition";
import { parseMonsterLevel } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const family = await db.getFamily(id);

  if (!family) {
    return {};
  }

  const creatorText = family.creator?.username
    ? ` by ${family.creator.username}`
    : "";

  const monsterCount = family.monsterCount || 0;
  const countText = `${monsterCount} monster${monsterCount !== 1 ? "s" : ""}`;
  const description = `${countText}${creatorText}`;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: family.name,
    description: `${family.name} - ${countText}${creatorText} | nimble.monster`,
    openGraph: {
      title: family.name,
      description: description,
      type: "article",
      url: `/f/${family.id}`,
    },
    twitter: {
      card: "summary",
      title: family.name,
      description: description,
    },
  };
}

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, family, monsters] = await Promise.all([
    auth(),
    db.getFamily(id),
    db.listMonstersByFamilyId(id),
  ]);

  if (!family) {
    notFound();
  }

  const isCreator = session?.user?.id === family.creatorId;
  const sortedMonsters =
    monsters?.sort(
      (a, b) => parseMonsterLevel(a.level) - parseMonsterLevel(b.level)
    ) ?? [];

  const [officialConditions, familyOwnerConditions] = await Promise.all([
    loadOfficialConditions(),
    listConditionsForDiscordId(family.creatorId),
  ]);

  const conditionsMap = new Map<string, (typeof officialConditions)[0]>();

  for (const condition of [...officialConditions, ...familyOwnerConditions]) {
    const key = condition.name.toLowerCase();
    if (!conditionsMap.has(key)) {
      conditionsMap.set(key, condition);
    }
  }

  const allConditions = Array.from(conditionsMap.values());

  return (
    <div className="container">
      <FamilyHeader
        family={family}
        showEditDeleteButtons={isCreator}
        conditions={allConditions}
      />
      {sortedMonsters.length === 0 ? (
        <p>No public monsters in this family.</p>
      ) : (
        <CardGrid
          monsters={sortedMonsters}
          currentUserId={session?.user?.id}
          hideFamilyAbilities={true}
          hideCreator={true}
          hideFamilyName={true}
          hideActions={true}
        />
      )}
    </div>
  );
}
