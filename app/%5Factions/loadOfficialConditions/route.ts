import { NextResponse } from "next/server";
import { listOfficialConditions } from "@/lib/db/condition";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

// Official conditions are shared by anonymous and authenticated viewers.
const read = telemetry(async () => {
  const data = await listOfficialConditions();
  return NextResponse.json(data, { headers });
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
