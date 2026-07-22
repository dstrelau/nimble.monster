import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UpdateMonsterInput } from "@/lib/services/monsters";
import { monstersService } from "@/lib/services/monsters";
import { telemetry } from "@/lib/telemetry";

export const POST = telemetry(async (request: Request) => {
  const session = await auth();

  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input: UpdateMonsterInput = await request.json();

  const monster = await monstersService.updateMonster(
    input,
    session.user.discordId
  );

  return NextResponse.json(monster);
});
