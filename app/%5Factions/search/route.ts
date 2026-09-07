import { NextResponse } from "next/server";
import type {
  GlobalSearchFilters,
  GlobalSearchResponse,
} from "@/lib/services/global-search/contract";
import {
  MAX_LIMIT,
  searchGlobal,
} from "@/lib/services/global-search/repository";
import { telemetry } from "@/lib/telemetry";

export const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 20;

export function parseSearchRequest(request: Request): {
  query: string;
  filters: GlobalSearchFilters;
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

  return {
    query,
    filters: {
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
