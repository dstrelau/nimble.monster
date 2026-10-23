import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { findAncestry } from "@/lib/services/ancestries/repository";
import { toggleReaction } from "@/lib/services/reactions";
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
  reactionType: z.enum(["thumbs_up", "thumbs_down"]),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { entityType, entityId, reactionType } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "entity.type": entityType,
    "entity.id": entityId,
    "user.id": session.user.id,
    "reaction.type": reactionType,
  });
  if (entityType === "ancestry" && !(await findAncestry(entityId))) {
    return NextResponse.json({ error: "Ancestry not found" }, { status: 404 });
  }
  const data = await toggleReaction(
    entityType,
    entityId,
    session.user.id,
    reactionType
  );
  return NextResponse.json({ success: true, data });
});
