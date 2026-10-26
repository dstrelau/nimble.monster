import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getMyReactions } from "@/lib/services/reactions";
import { telemetry } from "@/lib/telemetry";
import { isValidUUID } from "@/lib/utils/validation";

const inputSchema = z.object({
  entityType: z.enum([
    "monster",
    "item",
    "companion",
    "subclass",
    "class",
    "spellSchool",
    "background",
    "ancestry",
    "customRule",
    "collection",
    "adventure",
    "encounter",
  ]),
  entityId: z.string().refine(isValidUUID, "Invalid UUID"),
});

const headers = { "Cache-Control": "private, no-store" };

const read = telemetry(async (request: Request) => {
  const parsed = inputSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400, headers }
    );
  }
  const { entityType, entityId } = parsed.data;
  const session = await auth();
  trace.getActiveSpan()?.setAttributes({
    "entity.type": entityType,
    "entity.id": entityId,
    ...(session?.user?.id ? { "user.id": session.user.id } : {}),
  });
  const data = await getMyReactions(entityType, entityId, session?.user?.id);
  return NextResponse.json(data, { headers });
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
