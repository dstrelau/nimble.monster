import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  GLOBAL_SEARCH_ENTITY_TYPES,
  type GlobalSearchEntityType,
  type GlobalSearchFilters,
  type GlobalSearchResponse,
} from "@/lib/services/global-search/contract";
import {
  MAX_LIMIT,
  searchGlobal,
} from "@/lib/services/global-search/repository";
import { telemetry } from "@/lib/telemetry";

export const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 20;

function isEntityType(value: string): value is GlobalSearchEntityType {
  return GLOBAL_SEARCH_ENTITY_TYPES.some((type) => type === value);
}

function parseTypes(
  searchParams: URLSearchParams
): GlobalSearchEntityType[] | undefined {
  const values = searchParams.getAll("types");
  if (values.length === 0) return undefined;

  const types: GlobalSearchEntityType[] = [];
  for (const value of values) {
    for (const type of value.split(",")) {
      if (!isEntityType(type) || types.includes(type)) {
        throw new Error("Invalid search types");
      }
      types.push(type);
    }
  }
  if (types.length === 0) throw new Error("Invalid search types");
  return types;
}

export function parseSearchRequest(request: Request): {
  query: string;
  filters: GlobalSearchFilters;
  scope: "all" | "mine";
} {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");
  if (rawQuery === null) throw new Error("Search query is required");

  const query = rawQuery.trim();
  if (!query) throw new Error("Search query is required");
  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error(
      `Search query must be ${MAX_QUERY_LENGTH} characters or fewer`
    );
  }

  const rawLimit = searchParams.get("limit");
  const limit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_LIMIT ||
    (rawLimit !== null && !/^\d+$/.test(rawLimit))
  ) {
    throw new Error(`Search limit must be an integer from 1 to ${MAX_LIMIT}`);
  }

  const creatorId = searchParams.get("creatorId") ?? undefined;
  if (
    creatorId !== undefined &&
    (creatorId.length === 0 || creatorId.length > 128)
  ) {
    throw new Error("Invalid creator filter");
  }

  const rawScope = searchParams.get("scope");
  if (rawScope !== null && rawScope !== "mine") {
    throw new Error("Invalid search scope");
  }

  return {
    query,
    filters: {
      types: parseTypes(searchParams),
      ...(creatorId ? { creatorId } : {}),
      limit,
    },
    scope: rawScope === "mine" ? "mine" : "all",
  };
}

export const GET = telemetry(async (request: Request) => {
  let parsed: ReturnType<typeof parseSearchRequest>;
  try {
    parsed = parseSearchRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid search request",
      },
      { status: 400 }
    );
  }

  try {
    if (parsed.scope === "mine") {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      parsed.filters.creatorId = session.user.id;
    }
    const response: GlobalSearchResponse = {
      results: await searchGlobal(parsed.query, parsed.filters),
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error: "Search is temporarily unavailable",
      },
      { status: 500 }
    );
  }
});
