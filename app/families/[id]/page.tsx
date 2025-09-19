import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FamilyHeader } from "@/app/families/FamilyHeader";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
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

  const creatorText = family.creator?.displayName
    ? ` by ${family.creator.displayName}`
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
      url: `/families/${family.id}`,
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

  const isCreator = session?.user?.discordId === family.creatorId;

  return (
    <div className="container mx-auto">
      <FamilyHeader family={family} showEditDeleteButtons={isCreator} />
      {monsters.length === 0 ? (
        <p>No public monsters in this family.</p>
      ) : (
        <CardGrid
          monsters={monsters}
          hideFamilyAbilities={true}
          hideCreator={true}
          hideFamilyName={true}
          hideActions={true}
        />
      )}
    </div>
  );
}
