import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import {
  officialConditionsQueryOptions,
  userConditionsQueryOptions,
} from "@/lib/hooks/useConditions";
import { getQueryClient } from "@/lib/queryClient";
import { sourcesQueryOptions } from "@/lib/services/sources";

interface HydratedBuilderDataProps {
  includeSources?: boolean;
  children: ReactNode;
}

export async function HydratedBuilderData({
  includeSources = false,
  children,
}: HydratedBuilderDataProps) {
  const session = await auth();
  const queryClient = getQueryClient();
  const queries = [queryClient.prefetchQuery(officialConditionsQueryOptions())];

  if (session?.user?.discordId) {
    queries.push(
      queryClient.prefetchQuery(
        userConditionsQueryOptions({ discordId: session.user.discordId })
      )
    );
  }
  if (includeSources) {
    queries.push(queryClient.prefetchQuery(sourcesQueryOptions()));
  }

  await Promise.all(queries);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
