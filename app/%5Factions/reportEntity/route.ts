import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { createReport } from "@/lib/services/reports";
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
  reason: z.enum([
    "inappropriate",
    "spam",
    "plagiarism",
    "inaccurate",
    "other",
  ]),
  details: z.string(),
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
  const { entityType, entityId, reason, details } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "entity.type": entityType,
    "entity.id": entityId,
    "user.id": session.user.id,
    "report.reason": reason,
  });
  await createReport(entityType, entityId, session.user.id, reason, details);
  return NextResponse.json({ success: true });
});
