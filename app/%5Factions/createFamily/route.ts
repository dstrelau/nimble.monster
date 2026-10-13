import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { FamilyMutationResult } from "@/app/%5Factions/_family/contract";
import { familyInputSchema } from "@/app/%5Factions/_family/input";
import { auth } from "@/lib/auth";
import { createFamily } from "@/lib/db/family";
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
  const parsed = familyInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttribute("user.id", session.user.id);
  const family = await createFamily({
    ...parsed.data,
    discordId: session.user.discordId,
  });
  revalidatePath("/my/families");
  trace.getActiveSpan()?.setAttribute("family.id", family.id);
  const result: FamilyMutationResult = { id: family.id, name: family.name };
  return NextResponse.json(result, { status: 201 });
});
