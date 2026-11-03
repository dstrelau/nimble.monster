import { NextResponse } from "next/server";
import { z } from "zod";
import { searchUsers } from "@/lib/db/user";
import { telemetry } from "@/lib/telemetry";

const inputSchema = z.object({ query: z.string() });
const headers = { "Cache-Control": "private, no-store" };

// Public creator lookup, also used by the admin picker. Search is not authority
// to change feature flags; that mutation retains its own admin boundary.
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
  return NextResponse.json(await searchUsers(parsed.data.query, 20), {
    headers,
  });
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
