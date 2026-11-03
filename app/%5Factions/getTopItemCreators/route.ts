import { NextResponse } from "next/server";
import { topItemCreators } from "@/lib/db/user";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

// These public catalogue suggestions are the same for every viewer.
const read = telemetry(async () => {
  return NextResponse.json(await topItemCreators(10), { headers });
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
