import { NextResponse } from "next/server";
import { getNavCounts } from "@/lib/db/nav";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

// These are public catalogue totals, not session-specific library counts.
const read = telemetry(async () => {
  return NextResponse.json(await getNavCounts(), { headers });
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
