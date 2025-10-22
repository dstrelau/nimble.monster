import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { monsterSourcesQueryOptions } from "@/app/monsters/hooks";
import { UserAvatar } from "@/components/app/UserAvatar";
import * as db from "@/lib/db";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { itemsService } from "@/lib/services/items";
import * as monstersRepo from "@/lib/services/monsters/repository";
import { sourcesQueryOptions } from "@/lib/services/sources";
import { getSiteName } from "@/lib/utils/branding";
import { userProfileMonstersInfiniteQueryOptions } from "./hooks";
import TabsContent from "./TabsContent";

const searchParamsSchema = z.object({
  tab: z.string().optional(),
  sort: z
    .enum(["createdAt", "-createdAt", "level", "-level", "name", "-name"])
    .default("-createdAt"),
  type: z.enum(["all", "standard", "legendary", "minion"]).default("all"),
  search: z.string().optional(),
});

type TabType = "monsters" | "collections" | "families" | "companions" | "items";

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

  const [items, collections, companions, monstersCount] = await Promise.all([
    itemsService.listPublicItemsForUser(user.id),
    db.listPublicCollectionsHavingMonstersForUser(user.id),
    db.listPublicCompanionsForUser(user.id),
    monstersRepo.countPublicMonstersForUser(user.id),
  ]);

  const title = `${user.displayName} - ${siteName}`;
  const description = [
    monstersCount > 0 && `${monstersCount} monsters`,
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

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { username } = await params;
  const rawParams = await searchParams;
  const parsedParams = searchParamsSchema.parse(rawParams);

  const user = await db.getUserByUsername(username.toLowerCase());
  if (!user) {
    return notFound();
  }

  const [collections, families, companions, items, monstersCount] =
    await Promise.all([
      db.listPublicCollectionsHavingMonstersForUser(user.id),
      db.listPublicFamiliesHavingMonstersForUser(user.id),
      db.listPublicCompanionsForUser(user.id),
      itemsService.listPublicItemsForUser(user.id),
      monstersRepo.countPublicMonstersForUser(user.id),
    ]);

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(sourcesQueryOptions()),
    queryClient.prefetchQuery(monsterSourcesQueryOptions()),
    queryClient.prefetchQuery(officialConditionsQueryOptions()),
    queryClient.prefetchInfiniteQuery(
      userProfileMonstersInfiniteQueryOptions(user.id, {
        sort: parsedParams.sort,
        type: parsedParams.type,
        search: parsedParams.search,
      })
    ),
  ]);

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-4">
        <UserAvatar user={user} size={56} className="mr-4" />
        <div>
          <h1 className="text-3xl font-bold">{user.displayName}</h1>
        </div>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <TabsContent
          creatorId={user.id}
          monstersCount={monstersCount}
          collections={collections}
          families={families.filter((f) => !!f.monsterCount)}
          companions={companions}
          items={items}
          initialTab={parsedParams.tab as TabType | undefined}
        />
      </HydrationBoundary>
    </div>
  );
}
