import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { publicAncestriesInfiniteQueryOptions } from "@/app/ancestries/hooks";
import { publicBackgroundsInfiniteQueryOptions } from "@/app/backgrounds/hooks";
import { publicCompanionsInfiniteQueryOptions } from "@/app/companions/hooks";
import { publicItemsInfiniteQueryOptions } from "@/app/items/actions";
import { publicMonstersInfiniteQueryOptions } from "@/app/monsters/hooks";
import { getQueryClient } from "@/lib/queryClient";
import {
  publicClassesQueryOptions,
  publicSpellSchoolsQueryOptions,
  publicSubclassesQueryOptions,
} from "@/lib/queryOptions";
import { ancestriesService } from "@/lib/services/ancestries/service";
import { backgroundsService } from "@/lib/services/backgrounds/service";
import { paginatePublicCompanions } from "@/lib/services/companions";
import { itemsService } from "@/lib/services/items/service";
import { monstersService } from "@/lib/services/monsters";
import {
  listAllSources,
  listSourcesForEntityType,
  sourcesForEntityTypeQueryOptions,
  sourcesQueryOptions,
} from "@/lib/services/sources";

export async function HydratedCollectionEditor({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      ...publicMonstersInfiniteQueryOptions({
        sort: "-createdAt",
        type: "all",
        limit: 12,
      }),
      queryFn: () =>
        monstersService.paginatePublicMonsters({
          sort: "-createdAt",
          type: "all",
          limit: 12,
        }),
    }),
    queryClient.prefetchInfiniteQuery({
      ...publicItemsInfiniteQueryOptions({
        sort: "-createdAt",
        rarity: "all",
        limit: 12,
      }),
      queryFn: ({ pageParam }) =>
        itemsService.publicItemPage({
          sort: "-createdAt",
          rarity: "all",
          limit: 12,
          pageParam,
        }),
    }),
    queryClient.prefetchInfiniteQuery({
      ...publicCompanionsInfiniteQueryOptions({
        sort: "-createdAt",
        class: "all",
        limit: 6,
      }),
      queryFn: () =>
        paginatePublicCompanions({
          sort: "-createdAt",
          class: "all",
          limit: 6,
        }),
    }),
    queryClient.prefetchInfiniteQuery({
      ...publicAncestriesInfiniteQueryOptions({
        sort: "-createdAt",
        limit: 12,
      }),
      queryFn: () =>
        ancestriesService.paginatePublicAncestries({
          sort: "-createdAt",
          limit: 12,
        }),
    }),
    queryClient.prefetchInfiniteQuery({
      ...publicBackgroundsInfiniteQueryOptions({
        sort: "-createdAt",
        limit: 12,
      }),
      queryFn: () =>
        backgroundsService.paginatePublicBackgrounds({
          sort: "-createdAt",
          limit: 12,
        }),
    }),
    queryClient.prefetchQuery(publicClassesQueryOptions()),
    queryClient.prefetchQuery(publicSubclassesQueryOptions()),
    queryClient.prefetchQuery(publicSpellSchoolsQueryOptions()),
    queryClient.prefetchQuery({
      ...sourcesQueryOptions(),
      queryFn: listAllSources,
    }),
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("monsters"),
      queryFn: () => listSourcesForEntityType("monsters"),
    }),
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("ancestries"),
      queryFn: () => listSourcesForEntityType("ancestries"),
    }),
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("backgrounds"),
      queryFn: () => listSourcesForEntityType("backgrounds"),
    }),
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("classes"),
      queryFn: () => listSourcesForEntityType("classes"),
    }),
    queryClient.prefetchQuery({
      ...sourcesForEntityTypeQueryOptions("subclasses"),
      queryFn: () => listSourcesForEntityType("subclasses"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
