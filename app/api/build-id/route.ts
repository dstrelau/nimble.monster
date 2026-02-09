import { NextResponse } from "next/server";

// Unique per server process start, which corresponds to per deployment
const BUILD_ID = crypto.randomUUID();

export function GET() {
  return NextResponse.json({ buildId: BUILD_ID });
}
