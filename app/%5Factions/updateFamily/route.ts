import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { FamilyMutationResult } from "@/app/%5Factions/_family/contract";
import { updateFamilySchema } from "@/app/%5Factions/_family/input";
import { auth } from "@/lib/auth";
import { updateFamily } from "@/lib/db/family";
import { internalAction } from "@/lib/internal-action";
import type { FamilyOverview } from "@/lib/types";
import { getFamilyUrl, getUserUrl } from "@/lib/utils/url";

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
  const parsed = updateFamilySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttributes({
    "user.id": session.user.id,
    "family.id": parsed.data.id,
  });
  let family: FamilyOverview;
  try {
    family = await updateFamily({
      id: parsed.data.id,
      ...parsed.data.input,
      discordId: session.user.discordId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "family not found") {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }
    throw error;
  }
  revalidatePath(getUserUrl(session.user));
  revalidatePath("/my/families");
  revalidatePath(getFamilyUrl(family));
  const result: FamilyMutationResult = { id: family.id, name: family.name };
  return NextResponse.json(result);
});
