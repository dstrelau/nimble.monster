import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { deleteHazard } from "@/lib/services/hazards";
import { monstersService } from "@/lib/services/monsters";
import { isValidUUID } from "@/lib/utils/validation";

const inputSchema = z.object({
  id: z.string().refine(isValidUUID, "Invalid UUID"),
  kind: z.enum(["monster", "hazard"]),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id || !session.user.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const { id, kind } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "bestiary.id": id,
    "bestiary.kind": kind,
    "user.id": session.user.id,
  });
  const deleted =
    kind === "monster"
      ? await monstersService.deleteMonster(id, session.user.discordId)
      : await deleteHazard(id, session.user.discordId);
  trace.getActiveSpan()?.setAttributes({
    "delete.rows_affected": deleted ? 1 : 0,
    "delete.result": deleted ? "success" : "not_found",
  });
  if (!deleted) {
    return NextResponse.json(
      { error: "Bestiary entry not found" },
      { status: 404 }
    );
  }
  const section = kind === "monster" ? "monsters" : "hazards";
  revalidatePath(`/my/${section}`);
  revalidatePath(`/${section}`);
  revalidatePath(`/${section}/[id]`, "page");
  return NextResponse.json({ success: true });
});
