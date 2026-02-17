import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Card as AncestryCard } from "@/app/ui/ancestry/Card";
import { Card as BackgroundCard } from "@/app/ui/background/Card";
import { Card as CompanionCard } from "@/app/ui/companion/Card";
import { Card as ItemCard } from "@/app/ui/item/Card";
import { Card as MonsterCard } from "@/app/ui/monster/Card";
import { Card as SchoolCard } from "@/app/ui/school/Card";
import { SubclassMiniCard } from "@/app/ui/subclass/SubclassMiniCard";
import { CollectionHeader } from "@/components/CollectionHeader";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { listConditionsForDiscordId, listOfficialConditions } from "@/lib/db";
import { itemsSortedByName, monstersSortedByLevelInt } from "@/lib/utils";
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
  const isEmpty =
    collection.monsters.length === 0 &&
    collection.items.length === 0 &&
    collection.companions.length === 0 &&
    collection.ancestries.length === 0 &&
    collection.backgrounds.length === 0 &&
    collection.subclasses.length === 0 &&
    collection.spellSchools.length === 0;

  return (
    <div>
      <CollectionHeader
        collection={collection}
        showEditDeleteButtons={isCreator}
        conditions={conditions}
      />

      {isEmpty ? (
        <p className="text-center text-muted-foreground py-8">
          This collection is empty.
        </p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start">
          {monstersSortedByLevelInt(collection.monsters).map((m) => (
            <MonsterCard key={m.id} monster={m} creator={m.creator} />
          ))}
          {itemsSortedByName(collection.items).map((item) => (
            <ItemCard key={item.id} item={item} creator={item.creator} />
          ))}
          {collection.companions.map((c) => (
            <CompanionCard key={c.id} companion={c} creator={c.creator} />
          ))}
          {collection.ancestries.map((ancestry) => (
            <AncestryCard key={ancestry.id} ancestry={ancestry} />
          ))}
          {collection.backgrounds.map((background) => (
            <BackgroundCard key={background.id} background={background} />
          ))}
          {collection.subclasses.map((subclass) => (
            <SubclassMiniCard key={subclass.id} subclass={subclass} />
          ))}
          {collection.spellSchools.map((school) => (
            <SchoolCard key={school.id} spellSchool={school} mini={true} />
          ))}
        </div>
      )}
    </div>
  );
}
