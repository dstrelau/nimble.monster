import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { listSourcesForEntityType } from "@/lib/services/sources/repository";
import { telemetry } from "@/lib/telemetry";

const inputSchema = z.object({
  entityType: z.enum([
    "monsters",
    "ancestries",
    "backgrounds",
    "classes",
    "subclasses",
    "spell_schools",
  ]),
});
const headers = { "Cache-Control": "private, no-store" };

// Source options are anonymous-readable catalogue metadata, not owner-scoped rows.
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
  trace.getActiveSpan()?.setAttribute("entity.type", parsed.data.entityType);
  return NextResponse.json(
    await listSourcesForEntityType(parsed.data.entityType),
    { headers }
  );
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
