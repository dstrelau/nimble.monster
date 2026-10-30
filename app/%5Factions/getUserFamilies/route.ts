import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listFamiliesForUser } from "@/lib/db/family";
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
  const families = await listFamiliesForUser(session.user.discordId);
  return NextResponse.json(families, { headers });
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
