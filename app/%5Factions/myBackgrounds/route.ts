import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  backgroundsService,
  PaginateBackgroundsSortOptions,
} from "@/lib/services/backgrounds/service";
import { telemetry } from "@/lib/telemetry";
import { decodeCursor } from "@/lib/utils/cursor";

const schema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateBackgroundsSortOptions).default("-createdAt"),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.string().min(1).optional(),
  source: z.string().optional(),
});
const cursorSchema = z.union([
  z.object({
    sort: z.enum(["name", "-name", "createdAt", "-createdAt"]),
    value: z.string(),
    id: z.string().min(1),
  }),
  z.object({
    sort: z.literal("-likes"),
    value: z.number(),
    id: z.string().min(1),
  }),
]);
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
      { error: "Invalid background search" },
      { status: 400, headers }
    );
  }
  if (parsed.data.cursor) {
    const cursor = cursorSchema.safeParse(decodeCursor(parsed.data.cursor));
    if (!cursor.success || cursor.data.sort !== parsed.data.sort) {
      return NextResponse.json(
        { error: "Invalid cursor" },
        { status: 400, headers }
      );
    }
  }
  // Preserve the existing owner-scoped public-only read; filters aren't authority.
  return NextResponse.json(
    await backgroundsService.paginatePublicBackgrounds({
      ...parsed.data,
      creatorId: session.user.id,
    }),
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
