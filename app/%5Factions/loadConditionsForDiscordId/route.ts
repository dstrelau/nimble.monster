import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { listConditionsForDiscordId } from "@/lib/db/condition";
import { telemetry } from "@/lib/telemetry";

const inputSchema = z.object({ discordId: z.string() });
const headers = { "Cache-Control": "private, no-store" };

// Creator conditions also render on anonymous content pages. The requested
// Discord ID is a lookup key, not session identity or write authority.
const read = telemetry(async (request: Request) => {
  const parsed = inputSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400, headers }
    );
  }
  trace
    .getActiveSpan()
    ?.setAttribute("creator.discord_id", parsed.data.discordId);
  const data = await listConditionsForDiscordId(parsed.data.discordId);
  return NextResponse.json(data, { headers });
});

export async function GET(request: Request) {
  try {
    return await read(request);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers }
    );
  }
}
