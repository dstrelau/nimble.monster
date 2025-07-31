import { notFound } from "next/navigation";
import * as db from "@/lib/db";
import TabsContent from "./TabsContent";
import React from "react";
import { UserAvatar } from "@/components/app/UserAvatar";

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const tab = (await searchParams).tab;

  // Fetch user data
  const user = await db.getUserByUsername(username);
  if (!user) {
    return notFound();
  }

  // Fetch user's public content
  const [monsters, collections, families] = await Promise.all([
    db.listPublicMonstersForDiscordID(username),
    db.getUserPublicCollections(username),
    db.getUserFamilies(user.discordId),
  ]);

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
        families={families}
        initialTab={tab as "monsters" | "collections" | "families" | undefined}
      />
    </div>
  );
}
