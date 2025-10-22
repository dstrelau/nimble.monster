import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PaginatedCompanionGrid } from "@/app/ui/companion/PaginatedCompanionGrid";
import { getQueryClient } from "@/lib/queryClient";
import { SUBCLASS_CLASSES } from "@/lib/types";
import { publicCompanionsInfiniteQueryOptions } from "./hooks";

const companionClassValues = [
  "all",
  ...SUBCLASS_CLASSES.map((c) => c.value),
] as const;

const searchParamsSchema = z.object({
  sort: z
    .enum(["name", "-name", "createdAt", "-createdAt"])
    .default("-createdAt"),
  class: z.enum(companionClassValues).default("all"),
  search: z.string().optional(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function CompanionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    redirect("/companions");
  }
  const params = parseResult.data;

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    publicCompanionsInfiniteQueryOptions(params)
  );

  return (
    <div className="container mx-auto">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaginatedCompanionGrid />
      </HydrationBoundary>
    </div>
  );
}
