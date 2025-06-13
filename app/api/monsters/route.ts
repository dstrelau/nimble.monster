import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createMonster } from "@/lib/db";
import type { CreateMonsterInput } from "@/lib/db";
import { telemetry } from "@/lib/telemetry";
import { trace } from "@opentelemetry/api";

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
    discordId: session.user.id,
  };

  const newMonster = await createMonster(input);

  span?.setAttributes({
    "monster.id": newMonster.id,
  });

  return NextResponse.json(newMonster, { status: 201 });
});
