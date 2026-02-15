import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addCorsHeaders } from "@/lib/cors";
import { itemsService } from "@/lib/services/items";
import { toJsonApiItem } from "@/lib/services/items/converters";
import { telemetry } from "@/lib/telemetry";

const CONTENT_TYPE = "application/vnd.api+json";

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
    const headers = new Headers({ "Content-Type": CONTENT_TYPE });
    addCorsHeaders(headers, request);
    return NextResponse.json(
      {
        errors: [
          {
            status: "400",
            title,
          },
        ],
      },
      { status: 400, headers }
    );
  }

  const { cursor, limit, sort, search, rarity } = result.data;

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

  const response: { data: typeof data; links?: { next: string } } = { data };

  if (nextCursor) {
    const url = new URL(request.url);
    url.searchParams.set("cursor", nextCursor);
    response.links = {
      next: `${url.pathname}?${url.searchParams.toString()}`,
    };
  }

  const headers = new Headers({ "Content-Type": CONTENT_TYPE });
  addCorsHeaders(headers, request);
  return NextResponse.json(response, { headers });
});
