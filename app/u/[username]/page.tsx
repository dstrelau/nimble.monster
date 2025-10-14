import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/app/UserAvatar";
import * as db from "@/lib/db";
import { itemsService } from "@/lib/services/items";
import { getSiteName } from "@/lib/utils/branding";
import TabsContent from "./TabsContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  const user = await db.getUserByUsername(username.toLowerCase());
  if (!user) {
    return {
      title: "User not found",
    };
  }

  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const siteName = getSiteName(hostname);

  const [monsters, items, collections, companions] = await Promise.all([
    db.listPublicMonstersForUser(user.id),
    itemsService.listPublicItemsForUser(user.id),
    db.listPublicCollectionsHavingMonstersForUser(user.id),
    db.listPublicCompanionsForUser(user.id),
  ]);

  const title = `${user.displayName} - ${siteName}`;
  const description = [
    monsters.length > 0 && `${monsters.length} monsters`,
    items.length > 0 && `${items.length} items`,
    collections.length > 0 && `${collections.length} collections`,
    companions.length > 0 && `${companions.length} companions`,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const tab = (await searchParams).tab;

  const user = await db.getUserByUsername(username.toLowerCase());
  if (!user) {
    return notFound();
  }

  const [monsters, collections, families, companions, items] =
    await Promise.all([
      db.listPublicMonstersForUser(user.id),
      db.listPublicCollectionsHavingMonstersForUser(user.id),
      db.listPublicFamiliesHavingMonstersForUser(user.id),
      db.listPublicCompanionsForUser(user.id),
      itemsService.listPublicItemsForUser(user.id),
    ]);

  return (
    <div className="container mx-auto">
      {/* User Profile Header */}
      <div className="flex items-center mb-4">
        <UserAvatar user={user} size={56} className="mr-4" />
        <div>
          <h1 className="text-3xl font-bold">{user.displayName}</h1>
        </div>
      </div>

      <TabsContent
        monsters={monsters}
        collections={collections}
        families={families.filter((f) => !!f.monsterCount)}
        companions={companions}
        items={items}
        initialTab={
          tab as
            | "monsters"
            | "collections"
            | "families"
            | "companions"
            | "items"
            | undefined
        }
      />
    </div>
  );
}
