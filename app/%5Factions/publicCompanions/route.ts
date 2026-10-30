import { NextResponse } from "next/server";
import { z } from "zod";
import { paginatePublicCompanions } from "@/lib/services/companions";
import { PaginateCompanionsSortOptions } from "@/lib/services/companions/types";
import { telemetry } from "@/lib/telemetry";
import { SUBCLASS_CLASSES } from "@/lib/types";
import { decodeCursor } from "@/lib/utils/cursor";

const schema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateCompanionsSortOptions).default("-createdAt"),
  class: z
    .enum(["all", ...SUBCLASS_CLASSES.map((c) => c.value)])
    .default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(6),
  cursor: z.string().min(1).optional(),
  creatorId: z.string().optional(),
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
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid companion search" },
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
  // Creator is only a public filter; this path never opts into private rows.
  return NextResponse.json(await paginatePublicCompanions(parsed.data), {
    headers,
  });
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
