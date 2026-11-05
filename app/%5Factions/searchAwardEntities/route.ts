import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { searchEntities } from "@/lib/db/award";
import { telemetry } from "@/lib/telemetry";

const inputSchema = z.object({
  entityType: z.enum([
    "monster",
    "item",
    "companion",
    "subclass",
    "school",
    "ancestry",
    "background",
  ]),
  query: z.string(),
});
const headers = { "Cache-Control": "private, no-store" };

const read = telemetry(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers }
    );
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  }
  const parsed = inputSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400, headers }
    );
  }
  return NextResponse.json(
    await searchEntities(parsed.data.entityType, parsed.data.query),
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
