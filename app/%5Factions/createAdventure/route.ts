import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { AdventureMutationResult } from "@/app/%5Factions/_adventure/contract";
import { adventureInputSchema } from "@/app/%5Factions/_adventure/input";
import { auth } from "@/lib/auth";
import { AdventureInputError, createAdventure } from "@/lib/db/adventures";
import { internalAction } from "@/lib/internal-action";

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = adventureInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const adventure = await createAdventure(session.user.id, parsed.data);
    revalidatePath("/my/adventures");
    revalidatePath(`/u/${session.user.username}/adventures`);
    trace.getActiveSpan()?.setAttribute("adventure.id", adventure.id);
    const result: AdventureMutationResult = {
      id: adventure.id,
      name: adventure.name,
    };
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AdventureInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
});
