import { notFound } from "next/navigation";
import { loadOfficialConditions } from "@/app/actions/conditions";
import { UserAvatar } from "@/components/app/UserAvatar";
import * as db from "@/lib/db";
import TabsContent from "./TabsContent";

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const tab = (await searchParams).tab;

  const user = await db.getUserByUsername(username);
  if (!user) {
    return notFound();
  }

  const [
    monsters,
    collections,
    families,
    companions,
    items,
    userConditions,
    officialConditions,
  ] = await Promise.all([
    db.listPublicMonstersForDiscordID(username),
    db.getUserPublicCollectionsHavingMonsters(username),
    db.getUserPublicFamiliesWithMonsters(user.discordId),
    db.listPublicCompanionsForDiscordID(username),
    db.listPublicItemsForDiscordID(username),
    db.listConditionsForDiscordId(user.discordId),
    loadOfficialConditions(),
  ]);
  const conditions = [...userConditions, ...officialConditions];

  return (
    <div className="container mx-auto">
      {/* User Profile Header */}
      <div className="flex items-center mb-4">
        <UserAvatar user={user} size={72} className="mr-4" />
        <div>
          <h1 className="text-3xl font-bold">{username}</h1>
        </div>
      </div>

      <TabsContent
        monsters={monsters}
        collections={collections}
        families={families.filter((f) => !!f.monsterCount)}
        companions={companions}
        items={items}
        conditions={conditions}
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
