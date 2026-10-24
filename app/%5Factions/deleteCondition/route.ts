import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteCondition } from "@/lib/db/condition";
import { internalAction } from "@/lib/internal-action";
import { isValidUUID } from "@/lib/utils/validation";

const inputSchema = z.object({
  id: z.string().refine(isValidUUID, "Invalid UUID"),
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
  const { id } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "condition.id": id,
    "user.id": session.user.id,
  });
  const deleted = await deleteCondition(id, session.user.discordId);
  trace.getActiveSpan()?.setAttributes({
    "delete.rows_affected": deleted ? 1 : 0,
    "delete.result": deleted ? "success" : "not_found",
  });
  if (!deleted) {
    return NextResponse.json({ error: "Condition not found" }, { status: 404 });
  }
  revalidatePath("/my", "layout");
  return NextResponse.json({ success: true });
});
