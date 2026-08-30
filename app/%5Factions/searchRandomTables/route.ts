import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  SearchRandomTablesInput,
  SearchRandomTablesResult,
} from "@/app/%5Factions/_random-tables/contract";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import { searchPublicRandomTables } from "@/lib/services/random-tables/repository";

const searchRandomTablesSchema = z.object({
  sort: z.enum(["name", "-name", "createdAt", "-createdAt"]),
  search: z.string().nullable(),
  limit: z.number().int().min(1).max(50),
  page: z.number().int().min(0),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isFeatureFlagEnabled(session.user.id, "random-tables"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = searchRandomTablesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid random table search",
      },
      { status: 400 }
    );
  }

  const input: SearchRandomTablesInput = parsed.data;
  const descending = input.sort.startsWith("-");
  const sortField = descending ? input.sort.slice(1) : input.sort;
  const randomTables = await searchPublicRandomTables({
    searchTerm: input.search || undefined,
    sortBy: sortField === "name" ? "name" : "createdAt",
    sortDirection: descending ? "desc" : "asc",
    limit: input.limit,
    offset: input.page * input.limit,
  });
  const result: SearchRandomTablesResult = {
    data: randomTables.map((randomTable) => ({
      ...randomTable,
      createdAt: randomTable.createdAt?.toISOString(),
    })),
  };
  return NextResponse.json(result);
});
