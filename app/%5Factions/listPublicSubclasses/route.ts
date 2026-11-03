import { NextResponse } from "next/server";
import { listPublicSubclasses } from "@/lib/db/subclass";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

// The catalogue is public-only for every viewer; query parameters are not authority.
const read = telemetry(async () => {
  return NextResponse.json(await listPublicSubclasses(), { headers });
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
