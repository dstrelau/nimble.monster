import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { RandomTablesListView } from "@/components/random-table/RandomTablesListView";
import { auth } from "@/lib/auth";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";

const searchParamsSchema = z.object({
  sort: z
    .enum(["createdAt", "-createdAt", "name", "-name"])
    .default("-createdAt"),
  search: z.string().optional(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function RandomTablesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!(await isFeatureFlagEnabled(session?.user?.id, "random-tables"))) {
    notFound();
  }

  const rawParams = await searchParams;
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    redirect("/random-tables");
  }
  return <RandomTablesListView />;
}
