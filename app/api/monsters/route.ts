import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addCorsHeaders } from "@/lib/cors";
import type { CreateMonsterInput } from "@/lib/services/monsters";
import { monstersService } from "@/lib/services/monsters";
import { toJsonApiMonster } from "@/lib/services/monsters/converters";
import { telemetry } from "@/lib/telemetry";

const CONTENT_TYPE = "application/vnd.api+json; nimble.version=202510.beta";

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
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    const title =
      issue.path[0] === "sort" ? "Invalid sort parameter" : issue.message;
    const headers = new Headers({ "Content-Type": CONTENT_TYPE });
    addCorsHeaders(headers);
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

  const { cursor, limit, sort, search, level } = result.data;

  span?.setAttributes({
    "params.limit": limit,
    "params.sort": sort,
  });
  cursor && span?.setAttributes({ "params.cursor": cursor });
  search && span?.setAttributes({ "params.search": search });
  level && span?.setAttributes({ "params.level": level });

  const { data: monsters, nextCursor } =
    await monstersService.paginatePublicMonsters({
      cursor,
      limit,
      sort,
      search,
      level,
    });

  const data = monsters.map(toJsonApiMonster);

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
  addCorsHeaders(headers);
  return NextResponse.json(response, { headers });
});

export const POST = telemetry(async (request: Request) => {
  const session = await auth();
  const span = trace.getActiveSpan();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  span?.setAttributes({
    "user.id": session.user.id,
  });

  const monsterData = await request.json();

  span?.setAttributes({
    "monster.create.data_keys": Object.keys(monsterData).join(","),
    "monster.create.data_size": JSON.stringify(monsterData).length,
  });

  const input: CreateMonsterInput = {
    ...monsterData,
  };

  const newMonster = await monstersService.createMonster(
    input,
    session.user.discordId
  );

  span?.setAttributes({
    "monster.id": newMonster.id,
  });

  return NextResponse.json(newMonster, { status: 201 });
});
