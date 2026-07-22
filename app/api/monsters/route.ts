import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonApiError, jsonApiHeaders, parseInclude } from "@/lib/api";
import { toJsonApiFamily } from "@/lib/services/families/converters";
import { monstersService } from "@/lib/services/monsters";
import { toJsonApiMonster } from "@/lib/services/monsters/converters";
import {
  MonsterRoleOptions,
  MonsterTypeOptions,
} from "@/lib/services/monsters/types";
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
  sort: z
    .enum(["name", "-name", "createdAt", "-createdAt", "level", "-level"])
    .default("name"),
  search: z.string().optional(),
  level: z.coerce.number().optional(),
  type: z.enum(MonsterTypeOptions).optional(),
  role: z.enum(MonsterRoleOptions).optional(),
});

export const GET = telemetry(async (request: Request) => {
  const span = trace.getActiveSpan();
  const { searchParams } = new URL(request.url);

  const result = querySchema.safeParse({
    cursor: searchParams.get("cursor") || undefined,
    limit: searchParams.get("limit") || undefined,
    sort: searchParams.get("sort") || undefined,
    search: searchParams.get("search") || undefined,
    level: searchParams.get("level") || undefined,
    type: searchParams.get("type") || undefined,
    role: searchParams.get("role") || undefined,
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    const title =
      issue.path[0] === "sort" ? "Invalid sort parameter" : issue.message;
    return jsonApiError(400, title);
  }

  const { cursor, limit, sort, search, level, type, role } = result.data;

  const includeResult = parseInclude(searchParams, ["families", "creator"]);
  if (!includeResult.ok) {
    return includeResult.response;
  }
  const includeFamilies = includeResult.resources.includes("families");
  const includeCreator = includeResult.resources.includes("creator");

  span?.setAttributes({
    "params.limit": limit,
    "params.sort": sort,
  });
  cursor && span?.setAttributes({ "params.cursor": cursor });
  search && span?.setAttributes({ "params.search": search });
  level && span?.setAttributes({ "params.level": level });
  type && span?.setAttributes({ "params.type": type });
  role && span?.setAttributes({ "params.role": role });

  const { data: monsters, nextCursor } =
    await monstersService.paginatePublicMonsters({
      cursor,
      limit,
      sort,
      search,
      level,
      type,
      role,
    });

  const data = monsters.map(toJsonApiMonster);

  span?.setAttributes({
    "params.count": data.length,
    "params.has_more": nextCursor !== null,
  });

  const included: Array<
    | ReturnType<typeof toJsonApiFamily>
    | ReturnType<typeof collectCreators>[number]
  > = [];

  if (includeFamilies) {
    const familyMap = new Map<string, ReturnType<typeof toJsonApiFamily>>();
    for (const monster of monsters) {
      for (const family of monster.families ?? []) {
        if (!familyMap.has(family.id)) {
          familyMap.set(family.id, toJsonApiFamily(family));
        }
      }
    }
    included.push(...familyMap.values());
  }

  if (includeCreator) {
    included.push(...collectCreators(monsters));
  }

  const response: {
    data: typeof data;
    included?: typeof included;
    links?: { next: string };
  } = { data };

  if (included.length > 0) {
    response.included = included;
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
