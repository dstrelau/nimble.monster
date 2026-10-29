import { NextResponse } from "next/server";
import { z } from "zod";
import { monstersService } from "@/lib/services/monsters";
import {
  CreatureTypeOptions,
  MonsterRoleOptions,
  PaginateMonstersSortOptions,
} from "@/lib/services/monsters/types";
import { telemetry } from "@/lib/telemetry";
import { decodeCursor } from "@/lib/utils/cursor";

const schema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateMonstersSortOptions).default("-createdAt"),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.string().min(1).optional(),
  type: z.enum(CreatureTypeOptions).optional(),
  creatorId: z.string().optional(),
  excludeCreatorId: z.string().optional(),
  source: z.string().optional(),
  role: z.enum(MonsterRoleOptions).optional(),
  level: z.coerce.number().int().optional(),
});
const cursorSchema = z.union([
  z.object({
    sort: z.enum(["name", "-name", "createdAt", "-createdAt"]),
    value: z.string(),
    id: z.string().min(1),
  }),
  z.object({
    sort: z.enum(["level", "-level", "-likes"]),
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
      { error: "Invalid monster search" },
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
  // Creator filters never opt into private rows or hazards.
  return NextResponse.json(
    await monstersService.paginatePublicMonsters(parsed.data),
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
