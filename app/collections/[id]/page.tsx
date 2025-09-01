import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

  const creatorText = collection.creator?.username
    ? ` by ${collection.creator.username}`
    : "";

  const monsterCount = collection.monsters?.length || 0;
  const countText = `${monsterCount} monster${monsterCount !== 1 ? "s" : ""}`;
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
    collection.creator.discordId !== session?.user.id
  ) {
    notFound();
  }

  const isCreator = session?.user?.id === collection.creator.discordId;

  return (
    <div className="container">
      <CollectionHeader
        collection={collection}
        showEditDeleteButtons={isCreator}
        conditions={conditions}
      />
      {collection.monsters.length === 0 ? (
        <p>No monsters in this collection.</p>
      ) : (
        <CardGrid
          monsters={collection.monsters}
          currentUserId={session?.user?.id}
        />
      )}
    </div>
  );
}
