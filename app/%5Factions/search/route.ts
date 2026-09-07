import { NextResponse } from "next/server";
import type {
  GlobalSearchEntityType,
  GlobalSearchFilters,
  GlobalSearchResponse,
} from "@/lib/services/global-search/contract";
import { GLOBAL_SEARCH_ENTITY_TYPES } from "@/lib/services/global-search/contract";
import {
  listRecentGlobal,
  MAX_LIMIT,
  searchGlobal,
} from "@/lib/services/global-search/repository";
import { telemetry } from "@/lib/telemetry";

export const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 20;

export function parseSearchRequest(request: Request): {
  query: string;
  type?: GlobalSearchEntityType;
  filters: GlobalSearchFilters;
} {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");
  const query = rawQuery?.trim();
  if (query && query.length > MAX_QUERY_LENGTH) {
    throw new Error(
      `Search query must be ${MAX_QUERY_LENGTH} characters or fewer`
    );
  }

  const rawType = searchParams.get("type");
  const type = GLOBAL_SEARCH_ENTITY_TYPES.find(
    (entityType) => entityType === rawType
  );
  if (rawType !== null && !type) throw new Error("Invalid search type");
  if (!query && !type) throw new Error("Search query or type is required");

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

  return {
    query: query ?? "",
    ...(type ? { type } : {}),
    filters: {
      ...(type ? { types: [type] } : {}),
      limit,
    },
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
    const results = parsed.query
      ? await searchGlobal(parsed.query, parsed.filters)
      : parsed.type
        ? await listRecentGlobal(parsed.type, parsed.filters.limit)
        : [];
    const response: GlobalSearchResponse = {
      results,
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
