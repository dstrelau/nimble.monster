import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { internalAction } from "@/lib/internal-action";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import { isValidUUID } from "@/lib/utils/validation";

const deleteRandomTableSchema = z.object({
  id: z.string().refine(isValidUUID, "Invalid random table ID"),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id || !session.user.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isFeatureFlagEnabled(session.user.id, "random-tables"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = deleteRandomTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const deleted = await db.deleteRandomTable({
    id: parsed.data.id,
    discordId: session.user.discordId,
  });
  if (!deleted) {
    return NextResponse.json(
      { error: "Random table not found" },
      { status: 404 }
    );
  }

  revalidatePath("/my/random-tables");
  return NextResponse.json({ success: true });
});
