import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CardGrid as ItemCardGrid } from "@/app/ui/item/CardGrid";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { Card as SchoolCard } from "@/app/ui/school/Card";
import { CollectionHeader } from "@/components/CollectionHeader";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { listConditionsForDiscordId, listOfficialConditions } from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCollectionUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return {};
  const collection = await db.getCollection(uid);
  if (!collection) return {};

  if (id !== slugify(collection)) {
    return permanentRedirect(getCollectionUrl(collection));
  }

  const creatorText = collection.creator?.displayName
    ? ` by ${collection.creator.displayName}`
    : "";

  const monsterCount = collection.monsters?.length || 0;
  const itemCount = collection.items?.length || 0;
  const monsterText =
    monsterCount > 0
      ? `${monsterCount} monster${monsterCount !== 1 ? "s" : ""}`
      : "";
  const itemText =
    itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? "s" : ""}` : "";
  const countText = [monsterText, itemText].filter(Boolean).join(", ");
  const description = `${countText}${creatorText}`;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: collection.name,
    description: `${collection.name} - ${countText}${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: collection.name,
      description: description,
      type: "article",
      url: getCollectionUrl(collection),
    },
    twitter: {
      card: "summary",
      title: collection.name,
      description: description,
    },
  };
}

export default async function ShowCollectionView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const uid = deslugify(id);
  if (!uid) return notFound();
  const collection = await db.getCollection(uid, session?.user?.discordId);
  if (!collection) return notFound();

  if (id !== slugify(collection)) {
    return permanentRedirect(getCollectionUrl(collection));
  }

  const [officialConditions, userConditions] = await Promise.all([
    listOfficialConditions(),
    listConditionsForDiscordId(collection.creator.discordId),
  ]);
  const conditions = [...officialConditions, ...userConditions];
  if (
    collection.visibility === "private" &&
    collection.creator.discordId !== session?.user.discordId
  ) {
    notFound();
  }

  const isCreator = session?.user?.discordId === collection.creator.discordId;
  const hasMonsters = collection.monsters.length > 0;
  const hasItems = collection.items?.length > 0;
  const hasSpellSchools = collection.spellSchools?.length > 0;

  return (
    <div>
      <CollectionHeader
        collection={collection}
        showEditDeleteButtons={isCreator}
        conditions={conditions}
      />

      <div className="space-y-8">
        {hasMonsters && <CardGrid monsters={collection.monsters} />}

        {hasItems && <ItemCardGrid items={collection.items} />}

        {hasSpellSchools && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
            {collection.spellSchools.map((school) => (
              <SchoolCard key={school.id} spellSchool={school} mini={true} />
            ))}
          </div>
        )}

        {!hasMonsters && !hasItems && !hasSpellSchools && (
          <p className="text-center text-muted-foreground py-8">
            This collection is empty.
          </p>
        )}
      </div>
    </div>
  );
}
