import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { AdventureMutationResult } from "@/app/%5Factions/_adventure/contract";
import { adventureInputSchema } from "@/app/%5Factions/_adventure/input";
import { auth } from "@/lib/auth";
import { createAdventure } from "@/lib/db/adventures";
import { telemetry } from "@/lib/telemetry";

export const POST = telemetry(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = adventureInputSchema.safeParse(await request.json());
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
    const message =
      error instanceof Error ? error.message : "Could not save adventure";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
