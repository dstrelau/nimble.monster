import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { EditorMutationResult } from "@/app/%5Factions/_editors/contract";
import { saveEncounterSchema } from "@/app/%5Factions/_editors/input";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { internalAction } from "@/lib/internal-action";

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
  const parsed = saveEncounterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { id, ...input } = parsed.data;
    const encounter = id
      ? await db.updateEncounter({
          id,
          ...input,
          discordId: session.user.discordId,
        })
      : await db.createEncounter({
          ...input,
          discordId: session.user.discordId,
        });

    revalidatePath("/my/encounters");
    if (id) revalidatePath("/encounters/[id]", "page");
    trace.getActiveSpan()?.setAttributes({
      "encounter.id": encounter.id,
      "user.id": session.user.id,
    });
    const result: EditorMutationResult = {
      id: encounter.id,
      name: encounter.name,
    };
    return NextResponse.json(result, { status: id ? 200 : 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Encounter not found") {
      return NextResponse.json(
        { error: "Encounter not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
