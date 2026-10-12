import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { AncestryMutationResult } from "@/app/%5Factions/_ancestry/contract";
import { updateAncestrySchema } from "@/app/%5Factions/_ancestry/input";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { ancestriesService } from "@/lib/services/ancestries/service";

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
  const parsed = updateAncestrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const ancestry = await ancestriesService.updateAncestry(
      parsed.data.id,
      parsed.data.input,
      session.user.discordId
    );
    revalidatePath(`/ancestries/${ancestry.id}`);
    revalidatePath("/ancestries");
    revalidatePath("/my/ancestries");
    trace.getActiveSpan()?.setAttributes({
      "ancestry.id": ancestry.id,
      "user.id": session.user.id,
    });
    const result: AncestryMutationResult = {
      id: ancestry.id,
      name: ancestry.name,
    };
    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Ancestry not found or not owned by user"
    ) {
      return NextResponse.json(
        { error: "Ancestry not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
