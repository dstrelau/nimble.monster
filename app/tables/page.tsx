import { redirect } from "next/navigation";
import { z } from "zod";
import { RandomTablesListView } from "@/components/random-table/RandomTablesListView";

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
  const rawParams = await searchParams;
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    redirect("/tables");
  }
  return <RandomTablesListView />;
}
