import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import type { AdventureMutationResult } from "@/lib/contracts/adventure";
import { updateAdventure } from "@/lib/db/adventures";
import { adventureInputSchema } from "@/lib/services/adventures/input";
import { telemetry } from "@/lib/telemetry";

const updateAdventureSchema = z.object({
  id: z.string().uuid(),
  adventure: adventureInputSchema,
});

export const POST = telemetry(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateAdventureSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const adventure = await updateAdventure(
      parsed.data.id,
      session.user.id,
      parsed.data.adventure
    );
    revalidatePath("/my/adventures");
    revalidatePath("/adventures/[id]", "page");
    revalidatePath(`/u/${session.user.username}/adventures`);
    trace.getActiveSpan()?.setAttribute("adventure.id", adventure.id);
    const result: AdventureMutationResult = {
      id: adventure.id,
      name: adventure.name,
    };
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save adventure";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
