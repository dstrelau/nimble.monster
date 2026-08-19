import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { BestiaryMutationResult } from "@/app/%5Factions/_bestiary/contract";
import { createBestiaryEntrySchema } from "@/app/%5Factions/_bestiary/input";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { createHazard } from "@/lib/services/hazards";
import { monstersService } from "@/lib/services/monsters";

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

  const parsed = createBestiaryEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const entry =
      parsed.data.kind === "monster"
        ? await monstersService.createMonster(
            parsed.data.input,
            session.user.discordId
          )
        : await createHazard(parsed.data.input, session.user.discordId);

    revalidatePath(entry.hazard ? "/my/hazards" : "/my/monsters");
    trace.getActiveSpan()?.setAttributes({
      "bestiary.id": entry.id,
      "bestiary.kind": parsed.data.kind,
      "user.id": session.user.id,
    });
    const result: BestiaryMutationResult = {
      id: entry.id,
      name: entry.name,
      hazard: entry.hazard,
    };
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.endsWith("name is required")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
});
