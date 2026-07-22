import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { CreateMonsterInput } from "@/lib/services/monsters";
import { monstersService } from "@/lib/services/monsters";
import { telemetry } from "@/lib/telemetry";

export const POST = telemetry(async (request: Request) => {
  const session = await auth();
  const span = trace.getActiveSpan();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  span?.setAttributes({
    "user.id": session.user.id,
  });

  const input: CreateMonsterInput = await request.json();

  span?.setAttributes({
    "monster.create.data_keys": Object.keys(input).join(","),
    "monster.create.data_size": JSON.stringify(input).length,
  });

  let newMonster: Awaited<ReturnType<typeof monstersService.createMonster>>;
  try {
    newMonster = await monstersService.createMonster(
      input,
      session.user.discordId
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Monster name is required" ||
        error.message === "Creator Discord ID is required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  span?.setAttributes({
    "monster.id": newMonster.id,
  });

  return NextResponse.json(newMonster, { status: 201 });
});
