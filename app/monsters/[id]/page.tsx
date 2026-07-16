import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AddToEncounterDialog } from "@/app/monsters/AddToEncounterDialog";
import { MonsterDetailActions } from "@/app/monsters/MonsterDetailActions";
import { MonsterRemixes } from "@/app/monsters/MonsterRemixes";
import { MonsterVersionSelect } from "@/app/monsters/MonsterVersionSelect";
import { AddToCollectionDialog } from "@/components/collection/AddToCollectionDialog";
import { Card } from "@/components/monster/Card";
import { MonsterCollections } from "@/components/monster/MonsterCollections";
import { auth } from "@/lib/auth";
import { monstersService } from "@/lib/services/monsters";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterImageUrl, getMonsterUrl } from "@/lib/utils/url";

function versionQuerySuffix(v: string | string[] | undefined): string {
  return typeof v === "string" && v.length > 0
    ? `?${new URLSearchParams({ v }).toString()}`
    : "";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}): Promise<Metadata> {
  const { id: monsterId } = await params;
  const { v } = await searchParams;
  const uid = deslugify(monsterId);
  if (!uid) return {};
  const monster = await monstersService.getMonster(uid);

  if (!monster) return {};

  if (monsterId !== slugify(monster)) {
    return permanentRedirect(
      `${getMonsterUrl(monster)}${versionQuerySuffix(v)}`
    );
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
    description: `${monster.name} - ${monsterInfo}${creatorText} | ${SITE_NAME}`,
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const session = await auth();
  const { id: monsterId } = await params;
  const { v } = await searchParams;

  const uid = deslugify(monsterId);
  if (!uid) return notFound();
  const monster = await monstersService.getMonster(uid);
  if (!monster) return notFound();

  if (monsterId !== slugify(monster)) {
    return permanentRedirect(
      `${getMonsterUrl(monster)}${versionQuerySuffix(v)}`
    );
  }

  const collections = await monstersService.getMonsterCollections(uid);
  const remixes = await monstersService.getMonsterRemixes(uid);

  // if monster is not public, then user must be creator
  const isOwner =
    session?.user?.discordId === monster.creator?.discordId || false;

  if (monster.visibility !== "public" && !isOwner) {
    return notFound();
  }

  // Resolve which version to display. The live row is always the latest; an
  // older version is shown only when a valid ?v points at an archived version.
  const versions = await monstersService.listMonsterVersions(monster.id);
  const currentNumber = versions.find((entry) => entry.isCurrent)?.number ?? 1;
  const requested = typeof v === "string" ? Number.parseInt(v, 10) : Number.NaN;

  let displayMonster = monster;
  let selectedNumber = currentNumber;
  if (
    !Number.isNaN(requested) &&
    requested !== currentNumber &&
    versions.some((entry) => entry.number === requested)
  ) {
    const snapshot = await monstersService.getMonsterAtVersion(
      monster.id,
      requested
    );
    if (snapshot) {
      displayMonster = snapshot;
      selectedNumber = requested;
    }
  }

  return (
    <>
      <div className="flex justify-end items-start gap-2 mb-6">
        {session?.user && (
          <>
            <MonsterDetailActions monster={monster} isOwner={isOwner} />
            <AddToCollectionDialog type="monster" monsterId={monster.id} />
            <AddToEncounterDialog monsterId={monster.id} />
          </>
        )}
      </div>
      <div
        className={cn(
          "mx-auto flex flex-col items-center gap-12",
          monster.legendary ? "w-2xl" : "w-md"
        )}
      >
        {versions.length > 1 && (
          <MonsterVersionSelect
            versions={versions}
            selectedVersion={selectedNumber}
          />
        )}
        <Card
          monster={displayMonster}
          creator={displayMonster.creator}
          link={false}
          showEncounterGuidelines
        />
        <MonsterCollections collections={collections} />
        <MonsterRemixes remixes={remixes} />
      </div>
    </>
  );
}
