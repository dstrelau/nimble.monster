import { NextResponse } from "next/server";
import { listPublicClasses } from "@/lib/db/class";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

const read = telemetry(async () => {
  return NextResponse.json(await listPublicClasses(), { headers });
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
