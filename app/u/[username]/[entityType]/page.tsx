import {
  dehydrate,
  HydrationBoundary,
  type QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";
import { publicAncestriesInfiniteQueryOptions } from "@/app/ancestries/hooks";
import { publicBackgroundsInfiniteQueryOptions } from "@/app/backgrounds/hooks";
import { publicEncountersInfiniteQueryOptions } from "@/app/encounters/actions";
import { monsterSourcesQueryOptions } from "@/app/monsters/hooks";
import { userProfileMonstersInfiniteQueryOptions } from "@/app/u/[username]/hooks";
import ProfileEntityContent from "@/app/u/[username]/ProfileEntityContent";
import { MyLibrarySidebar } from "@/components/layout/MyLibrarySidebar";
import { UserAvatar } from "@/components/layout/UserAvatar";
import * as db from "@/lib/db";
import { officialConditionsQueryOptions } from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { itemsService } from "@/lib/services/items";
import { MonsterRoleOptions } from "@/lib/services/monsters/types";
import { sourcesQueryOptions } from "@/lib/services/sources";
import { MY_LIBRARY_ITEMS } from "@/lib/types/entity-links";
import { SITE_NAME } from "@/lib/utils/branding";

const monsterSearchParamsSchema = z.object({
  sort: z
    .enum(["createdAt", "-createdAt", "level", "-level", "name", "-name"])
    .catch("-createdAt")
    .default("-createdAt"),
  type: z
    .enum(["all", "standard", "legendary", "minion"])
    .catch("all")
    .default("all"),
  search: z.string().optional().catch(undefined),
  source: z.string().optional().catch(undefined),
  role: z.enum(MonsterRoleOptions).optional().catch(undefined),
  level: z.coerce.number().optional().catch(undefined),
});

const characterOptionSearchParamsSchema = z.object({
  sort: z
    .enum(["-createdAt", "createdAt", "name", "-name", "-likes"])
    .catch("-createdAt")
    .default("-createdAt"),
  search: z.string().optional().catch(undefined),
  source: z.string().optional().catch(undefined),
});

const encounterSearchParamsSchema = z.object({
  sort: z
    .enum(["name", "-name", "createdAt", "-createdAt"])
    .catch("-createdAt")
    .default("-createdAt"),
  search: z.string().optional().catch(undefined),
});

interface UserProfileEntityPageProps {
  params: Promise<{ username: string; entityType: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function isProfileEntityType(
  value: string
): value is (typeof MY_LIBRARY_ITEMS)[number]["key"] {
  return MY_LIBRARY_ITEMS.some((item) => item.key === value);
}

export async function generateMetadata({
  params,
}: UserProfileEntityPageProps): Promise<Metadata> {
  const { username, entityType } = await params;
  const user = await db.getUserByUsername(username.toLowerCase());
  if (!user || !isProfileEntityType(entityType)) {
    return { title: "User not found" };
  }

  const entityLabel = MY_LIBRARY_ITEMS.find(
    (item) => item.key === entityType
  )?.label;
  const title = `${user.displayName}'s ${entityLabel} - ${SITE_NAME}`;
  const description = `Public ${entityLabel?.toLowerCase()} created by ${user.displayName}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
  };
}

async function loadProfileEntityContent(
  entityType: (typeof MY_LIBRARY_ITEMS)[number]["key"],
  userId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  queryClient: QueryClient
): Promise<ReactNode> {
  switch (entityType) {
    case "monsters": {
      const searchParams = monsterSearchParamsSchema.parse(rawSearchParams);
      await queryClient.prefetchInfiniteQuery(
        userProfileMonstersInfiniteQueryOptions(userId, searchParams)
      );
      return <ProfileEntityContent entityType="monsters" creatorId={userId} />;
    }
    case "ancestries": {
      const searchParams =
        characterOptionSearchParamsSchema.parse(rawSearchParams);
      await queryClient.prefetchInfiniteQuery(
        publicAncestriesInfiniteQueryOptions({
          ...searchParams,
          creatorId: userId,
        })
      );
      return (
        <ProfileEntityContent entityType="ancestries" creatorId={userId} />
      );
    }
    case "backgrounds": {
      const searchParams =
        characterOptionSearchParamsSchema.parse(rawSearchParams);
      await queryClient.prefetchInfiniteQuery(
        publicBackgroundsInfiniteQueryOptions({
          ...searchParams,
          creatorId: userId,
        })
      );
      return (
        <ProfileEntityContent entityType="backgrounds" creatorId={userId} />
      );
    }
    case "encounters": {
      const searchParams = encounterSearchParamsSchema.parse(rawSearchParams);
      await queryClient.prefetchInfiniteQuery(
        publicEncountersInfiniteQueryOptions({
          ...searchParams,
          creatorId: userId,
        })
      );
      return (
        <ProfileEntityContent entityType="encounters" creatorId={userId} />
      );
    }
    case "families": {
      const families = await db.listPublicFamiliesHavingMonstersForUser(userId);
      return (
        <ProfileEntityContent
          entityType="families"
          families={families.filter((family) => !!family.monsterCount)}
        />
      );
    }
    case "companions":
      return (
        <ProfileEntityContent
          entityType="companions"
          companions={await db.listPublicCompanionsForUser(userId)}
        />
      );
    case "items":
      return (
        <ProfileEntityContent
          entityType="items"
          items={await itemsService.listPublicItemsForUser(userId)}
        />
      );
    case "classes":
      return (
        <ProfileEntityContent
          entityType="classes"
          classes={await db.listPublicClassesForUser(userId)}
        />
      );
    case "subclasses":
      return (
        <ProfileEntityContent
          entityType="subclasses"
          subclasses={await db.listPublicSubclassesForUser(userId)}
        />
      );
    case "spell-schools":
      return (
        <ProfileEntityContent
          entityType="spell-schools"
          spellSchools={await db.listPublicSpellSchoolsForUser(userId)}
        />
      );
    case "collections":
      return (
        <ProfileEntityContent
          entityType="collections"
          collections={
            await db.listPublicCollectionsHavingContentForUser(userId)
          }
        />
      );
    case "rules":
      return (
        <ProfileEntityContent
          entityType="rules"
          rules={await db.listPublicCustomRulesForUser(userId)}
        />
      );
  }
}

export default async function UserProfileEntityPage({
  params,
  searchParams,
}: UserProfileEntityPageProps) {
  const { username, entityType } = await params;
  const rawSearchParams = await searchParams;
  if (!isProfileEntityType(entityType)) notFound();

  const user = await db.getUserByUsername(username.toLowerCase());
  if (!user) notFound();

  const queryClient = getQueryClient();
  const [counts, content] = await Promise.all([
    db.getPublicLibraryCounts(user.id),
    loadProfileEntityContent(entityType, user.id, rawSearchParams, queryClient),
    queryClient.prefetchQuery(sourcesQueryOptions()),
    queryClient.prefetchQuery(monsterSourcesQueryOptions()),
    queryClient.prefetchQuery(officialConditionsQueryOptions()),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <UserAvatar user={user} size={56} className="mr-4" />
        <h1 className="text-3xl font-bold">{user.displayName}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <MyLibrarySidebar
          counts={counts}
          profileHref={`/u/${user.username}`}
          title={null}
        />
        <div className="min-w-0">
          <HydrationBoundary state={dehydrate(queryClient)}>
            {content}
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}
