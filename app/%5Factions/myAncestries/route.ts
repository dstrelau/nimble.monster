import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { paginatePublicAncestries } from "@/lib/services/ancestries/repository";
import { PaginateAncestriesSortOptions } from "@/lib/services/ancestries/service";
import { telemetry } from "@/lib/telemetry";
import { decodeCursor } from "@/lib/utils/cursor";

const schema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateAncestriesSortOptions).default("-createdAt"),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  cursor: z.string().min(1).optional(),
  source: z.string().optional(),
});
const headers = { "Cache-Control": "private, no-store" };

export const GET = telemetry(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers }
    );
  }
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ancestry search" },
      { status: 400, headers }
    );
  }
  const cursor = parsed.data.cursor ? decodeCursor(parsed.data.cursor) : null;
  if (parsed.data.cursor && (!cursor || cursor.sort !== parsed.data.sort)) {
    return NextResponse.json(
      { error: "Invalid cursor" },
      { status: 400, headers }
    );
  }
  try {
    const result = await paginatePublicAncestries(
      { ...parsed.data, creatorId: session.user.id },
      true
    );
    return NextResponse.json(result, { headers });
  } catch (error) {
    trace
      .getActiveSpan()
      ?.recordException(error instanceof Error ? error : String(error));
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers }
    );
  }
});
