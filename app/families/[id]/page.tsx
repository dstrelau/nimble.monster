import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { FamilyHeader } from "@/app/families/FamilyHeader";
import { FamilyImagePreview } from "@/components/family/FamilyImagePreview";
import { CardGrid } from "@/components/monster/CardGrid";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { getEntityImageVersion } from "@/lib/entity-image-version";
import * as monstersRepo from "@/lib/services/monsters/repository";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getFamilyImageUrl, getFamilyUrl } from "@/lib/utils/url";
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
  const imageEntity = { ...family, monsters: publicMonsters };
  const imageUrl =
    family.visibility === "public"
      ? `${getFamilyImageUrl(family)}?${getEntityImageVersion(imageEntity)}`
      : undefined;

  return {
    title: family.name,
    description: `${family.name} - ${countText}${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: family.name,
      description: description,
      type: "article",
      url: getFamilyUrl(family),
      ...(imageUrl ? { images: [{ url: imageUrl, alt: family.name }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: family.name,
      description: description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function FamilyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imagePreview?: string }>;
}) {
  const { id } = await params;
  const { imagePreview } = await searchParams;

  const uid = deslugify(id);
  if (!uid) return notFound();
  const family = await db.getFamily(uid);
  if (!family) return notFound();

  if (imagePreview === "overview" && family.visibility !== "public") {
    return notFound();
  }

  if (id !== slugify(family)) {
    return permanentRedirect(getFamilyUrl(family));
  }

  const [session, monsters] = await Promise.all([
    auth(),
    monstersRepo.listMonstersByFamilyId(uid),
  ]);

  const isCreator = session?.user?.discordId === family.creatorId;
  monsters.forEach((m) => {
    m.families = m.families.filter((f) => f.id !== family.id);
  });

  if (imagePreview === "overview") {
    return <FamilyImagePreview family={family} monsters={monsters} />;
  }

  return (
    <div>
      <FamilyHeader family={family} showEditDeleteButtons={isCreator} />
      {monsters.length === 0 ? (
        <p>No public monsters in this family.</p>
      ) : (
        <CardGrid monsters={monsters} />
      )}
    </div>
  );
}
