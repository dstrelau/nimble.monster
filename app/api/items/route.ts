import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonApiError, jsonApiHeaders, parseInclude } from "@/lib/api";
import { itemsService } from "@/lib/services/items";
import { toJsonApiItem } from "@/lib/services/items/converters";
import { collectCreators } from "@/lib/services/users/converters";
import { telemetry } from "@/lib/telemetry";

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be between 1 and 100")
    .max(100, "Limit must be between 1 and 100")
    .default(100),
  sort: z.enum(["name", "-name", "createdAt", "-createdAt"]).default("name"),
  search: z.string().optional(),
  rarity: z
    .enum([
      "all",
      "unspecified",
      "common",
      "uncommon",
      "rare",
      "very_rare",
      "legendary",
    ])
    .optional(),
});

export const GET = telemetry(async (request: Request) => {
  const span = trace.getActiveSpan();
  const { searchParams } = new URL(request.url);

  const result = querySchema.safeParse({
    cursor: searchParams.get("cursor") || undefined,
    limit: searchParams.get("limit") || undefined,
    sort: searchParams.get("sort") || undefined,
    search: searchParams.get("search") || undefined,
    rarity: searchParams.get("rarity") || undefined,
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    const title =
      issue.path[0] === "sort" ? "Invalid sort parameter" : issue.message;
    return jsonApiError(400, title);
  }

  const { cursor, limit, sort, search, rarity } = result.data;

  const includeResult = parseInclude(searchParams, ["creator"]);
  if (!includeResult.ok) {
    return includeResult.response;
  }
  const includeCreator = includeResult.resources.includes("creator");

  span?.setAttributes({
    "params.limit": limit,
    "params.sort": sort,
  });
  cursor && span?.setAttributes({ "params.cursor": cursor });
  search && span?.setAttributes({ "params.search": search });
  rarity && span?.setAttributes({ "params.rarity": rarity });

  const { data: items, nextCursor } = await itemsService.paginatePublicItems({
    cursor,
    limit,
    sort,
    search,
    rarity,
  });

  const data = items.map(toJsonApiItem);

  span?.setAttributes({
    "params.count": data.length,
    "params.has_more": nextCursor !== null,
  });

  const response: {
    data: typeof data;
    included?: ReturnType<typeof collectCreators>;
    links?: { next: string };
  } = { data };

  if (includeCreator) {
    const included = collectCreators(items);
    if (included.length > 0) {
      response.included = included;
    }
  }

  if (nextCursor) {
    const url = new URL(request.url);
    url.searchParams.set("cursor", nextCursor);
    response.links = {
      next: `${url.pathname}?${url.searchParams.toString()}`,
    };
  }

  return NextResponse.json(response, { headers: jsonApiHeaders() });
});
