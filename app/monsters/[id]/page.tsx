import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Card } from "@/app/ui/monster/Card";
import { AddToCollectionDialog } from "@/components/AddToCollectionDialog";
import { MonsterCollections } from "@/components/MonsterCollections";
import { MonsterDetailActions } from "@/components/MonsterDetailActions";
import { auth } from "@/lib/auth";
import { monstersService } from "@/lib/services/monsters";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterImageUrl, getMonsterUrl } from "@/lib/utils/url";

export const experimental_ppr = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: monsterId } = await params;
  const uid = deslugify(monsterId);
  const monster = await monstersService.getMonsterInternal(uid);

  if (!monster) return {};

  if (monsterId !== slugify(monster)) {
    return permanentRedirect(getMonsterUrl(monster));
  }

  const creatorText = monster.creator
    ? ` by ${monster.creator.displayName}`
    : "";
  const monsterInfo = [monster.legendary ? "Legendary" : "", monster.kind || ""]
    .filter(Boolean)
    .join(" ");

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: monster.name,
    description: `${monster.name} - ${monsterInfo}${creatorText} | nimble.monster`,
    openGraph: {
      title: monster.name,
      description: `${monsterInfo}${creatorText}`,
      type: "article",
      url: getMonsterUrl(monster),
      images: [
        {
          url: `${getMonsterImageUrl(monster)}?${monster.updatedAt.getTime()}`,
          alt: monster.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: monster.name,
      description: `${monsterInfo}${creatorText}`,
      images: [`/monsters/${monster.id}/image`],
    },
  };
}

export default async function MonsterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: monsterId } = await params;

  const uid = deslugify(monsterId);
  const monster = await monstersService.getMonsterInternal(uid);
  if (!monster) return notFound();

  if (monsterId !== slugify(monster)) {
    return permanentRedirect(getMonsterUrl(monster));
  }

  const collections = await monstersService.getMonsterCollections(uid);

  // if monster is not public, then user must be creator
  const isOwner =
    session?.user?.discordId === monster.creator?.discordId || false;

  if (monster.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <MonsterDetailActions monster={monster} />}
        {session?.user && (
          <AddToCollectionDialog type="monster" monsterId={monster.id} />
        )}
      </div>
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-12">
        <Card monster={monster} creator={monster.creator} link={false} />
        <MonsterCollections collections={collections} />
      </div>
    </div>
  );
}
