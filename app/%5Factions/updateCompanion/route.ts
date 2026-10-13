import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { CompanionMutationResult } from "@/app/%5Factions/_companion/contract";
import { updateCompanionSchema } from "@/app/%5Factions/_companion/input";
import { auth } from "@/lib/auth";
import { findCompanionWithCreator, updateCompanion } from "@/lib/db/companion";
import { internalAction } from "@/lib/internal-action";
import { getCompanionUrl } from "@/lib/utils/url";

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
  const parsed = updateCompanionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const existing = await findCompanionWithCreator(
    parsed.data.id,
    session.user.id
  );
  if (!existing) {
    return NextResponse.json({ error: "Companion not found" }, { status: 404 });
  }
  const companion = await updateCompanion({
    id: parsed.data.id,
    ...parsed.data.input,
    moreInfo: parsed.data.input.moreInfo || "",
    discordId: session.user.discordId,
  });
  revalidatePath(getCompanionUrl(companion));
  revalidatePath("/companions");
  revalidatePath("/my/companions");
  trace.getActiveSpan()?.setAttributes({
    "companion.id": companion.id,
    "user.id": session.user.id,
  });
  const result: CompanionMutationResult = {
    id: companion.id,
    name: companion.name,
  };
  return NextResponse.json(result);
});
