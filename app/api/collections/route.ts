import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { toJsonApiCollection } from "@/lib/services/collections/converters";
import * as repository from "@/lib/services/collections/repository";
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
});

export const GET = telemetry(async (request: Request) => {
  const span = trace.getActiveSpan();
  const { searchParams } = new URL(request.url);

  const result = querySchema.safeParse({
    cursor: searchParams.get("cursor") || undefined,
    limit: searchParams.get("limit") || undefined,
    sort: searchParams.get("sort") || undefined,
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    const title =
      issue.path[0] === "sort" ? "Invalid sort parameter" : issue.message;
    return NextResponse.json(
      {
        errors: [
          {
            status: "400",
            title,
          },
        ],
      },
      { status: 400, headers: { "Content-Type": CONTENT_TYPE } }
    );
  }

  const { cursor, limit, sort } = result.data;

  span?.setAttributes({
    "params.limit": limit,
    "params.sort": sort,
  });
  cursor && span?.setAttributes({ "params.cursor": cursor });

  const { collections, nextCursor } = await repository.listPublicCollections({
    cursor,
    limit,
    sort,
  });

  const data = collections.map(toJsonApiCollection);

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

  return NextResponse.json(response, {
    headers: {
      "Content-Type": CONTENT_TYPE,
    },
  });
});
