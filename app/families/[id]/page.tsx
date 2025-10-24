import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { FamilyHeader } from "@/app/families/FamilyHeader";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import * as monstersRepo from "@/lib/services/monsters/repository";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getFamilyUrl } from "@/lib/utils/url";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return {};
  const family = await db.getFamily(uid);
  if (!family) return {};

  if (id !== slugify(family)) {
    return permanentRedirect(getFamilyUrl(family));
  }

  const publicMonsters = await monstersRepo.listMonstersByFamilyId(uid);

  const creatorText = family.creator?.displayName
    ? ` by ${family.creator.displayName}`
    : "";

  const monsterCount = publicMonsters.length;
  const countText = `${monsterCount} monster${monsterCount !== 1 ? "s" : ""}`;
  const description = `${countText}${creatorText}`;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: family.name,
    description: `${family.name} - ${countText}${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: family.name,
      description: description,
      type: "article",
      url: getFamilyUrl(family),
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

  const uid = deslugify(id);
  if (!uid) return notFound();
  const family = await db.getFamily(uid);
  if (!family) return notFound();

  if (id !== slugify(family)) {
    return permanentRedirect(getFamilyUrl(family));
  }

  const [session, monsters] = await Promise.all([
    auth(),
    monstersRepo.listMonstersByFamilyId(uid),
  ]);

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
          hideFamilyName={true}
          hideActions={true}
        />
      )}
    </div>
  );
}
