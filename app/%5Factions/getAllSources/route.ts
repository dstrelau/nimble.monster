import { NextResponse } from "next/server";
import { listAllSources } from "@/lib/services/sources/repository";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

// Catalogue source options are shared by anonymous and authenticated viewers.
const read = telemetry(async () => {
  return NextResponse.json(await listAllSources(), { headers });
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
