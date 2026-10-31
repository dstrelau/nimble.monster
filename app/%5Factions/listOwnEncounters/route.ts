import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listEncountersWithMonstersForUser } from "@/lib/db/encounter";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

const read = telemetry(async () => {
  const session = await auth();
  if (!session?.user?.id || !session.user.discordId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401, headers }
    );
  }
  trace.getActiveSpan()?.setAttribute("user.id", session.user.id);
  const encounters = await listEncountersWithMonstersForUser(
    session.user.discordId
  );
  return NextResponse.json({ success: true, encounters }, { headers });
});

export async function GET() {
  try {
    return await read();
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers }
    );
  }
}
