import { NextResponse } from "next/server";
import { listPublicRandomTableMinis } from "@/lib/db/random-table";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };

const read = telemetry(async () =>
  NextResponse.json({ data: await listPublicRandomTableMinis() }, { headers })
);

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
