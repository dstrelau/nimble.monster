import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { CreateMonsterInput } from "@/lib/services/monsters";
import { monstersService } from "@/lib/services/monsters";
import { toZodMonster } from "@/lib/services/monsters/converters";
import * as repository from "@/lib/services/monsters/repository";
import { telemetry } from "@/lib/telemetry";

const CONTENT_TYPE = "application/vnd.nimble.v202510+json";

export const GET = telemetry(async (request: Request) => {
  const span = trace.getActiveSpan();
  const { searchParams } = new URL(request.url);

  const cursor = searchParams.get("cursor") || undefined;
  const limit = Number.parseInt(searchParams.get("limit") || "100", 10);
  const sort = searchParams.get("sort") || "name";

  const validSorts = [
    "name",
    "-name",
    "created_at",
    "-created_at",
    "level",
    "-level",
  ];
  if (!validSorts.includes(sort)) {
    return NextResponse.json(
      { error: "Invalid sort parameter" },
      { status: 400 }
    );
  }

  if (limit < 1 || limit > 1000) {
    return NextResponse.json(
      { error: "Limit must be between 1 and 1000" },
      { status: 400 }
    );
  }

  span?.setAttributes({
    "monsters.list.cursor": cursor || "none",
    "monsters.list.limit": limit,
    "monsters.list.sort": sort,
  });

  const { monsters, nextCursor } = await repository.listPublicMonsters({
    cursor,
    limit,
    sort: sort as
      | "name"
      | "-name"
      | "created_at"
      | "-created_at"
      | "level"
      | "-level",
  });

  const data = monsters.map(toZodMonster);

  span?.setAttributes({
    "monsters.list.count": data.length,
    "monsters.list.has_more": nextCursor !== null,
  });

  return NextResponse.json(
    { data, nextCursor },
    {
      headers: {
        "Content-Type": CONTENT_TYPE,
      },
    }
  );
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
