import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardGrid as ItemCardGrid } from "@/app/ui/item/CardGrid";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { CollectionHeader } from "@/components/CollectionHeader";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { listConditionsForDiscordId, listOfficialConditions } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const collection = await db.getCollection(id);

  if (!collection) {
    return {};
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
    description: `${collection.name} - ${countText}${creatorText} | nimble.monster`,
    openGraph: {
      title: collection.name,
      description: description,
      type: "article",
      url: `/collections/${collection.id}`,
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
  const collection = await db.getCollection(id);
  const session = await auth();
  if (!collection) {
    notFound();
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

  return (
    <div className="container mx-auto">
      <CollectionHeader
        collection={collection}
        showEditDeleteButtons={isCreator}
        conditions={conditions}
      />

      <div className="space-y-8">
        {hasMonsters && <CardGrid monsters={collection.monsters} />}

        {hasItems && <ItemCardGrid items={collection.items} />}

        {!hasMonsters && !hasItems && (
          <p className="text-center text-muted-foreground py-8">
            This collection is empty.
          </p>
        )}
      </div>
    </div>
  );
}
