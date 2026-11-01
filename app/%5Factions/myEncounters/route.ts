import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  MyEncountersPageSchema,
  paginateMyEncounters,
} from "@/lib/services/encounters/pagination";
import { telemetry } from "@/lib/telemetry";

const schema = MyEncountersPageSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(12),
  pageParam: z.coerce
    .number()
    .int()
    .min(0)
    .max(Math.floor(Number.MAX_SAFE_INTEGER / 100))
    .default(0),
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
  trace.getActiveSpan()?.setAttribute("user.id", session.user.id);
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid encounter search" },
      { status: 400, headers }
    );
  }
  return NextResponse.json(
    await paginateMyEncounters(session.user.id, parsed.data),
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
