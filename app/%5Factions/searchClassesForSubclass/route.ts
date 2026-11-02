import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { searchClassesForSubclass } from "@/lib/db/class";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };
const inputSchema = z.object({ searchTerm: z.string().optional() });

const read = telemetry(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const parsed = inputSchema.safeParse({
    searchTerm: params.get("searchTerm") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters" },
      { status: 400, headers }
    );
  }
  const session = await auth();
  if (session?.user?.id) {
    trace.getActiveSpan()?.setAttribute("user.id", session.user.id);
  }
  const options = await searchClassesForSubclass({
    ...parsed.data,
    userId: session?.user?.id,
  });
  return NextResponse.json(options, { headers });
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
