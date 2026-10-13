import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { SpellSchoolMutationResult } from "@/app/%5Factions/_spellSchool/contract";
import { updateSpellSchoolSchema } from "@/app/%5Factions/_spellSchool/input";
import { auth } from "@/lib/auth";
import { updateSpellSchool } from "@/lib/db/school";
import { internalAction } from "@/lib/internal-action";
import type { SpellSchool } from "@/lib/types";

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
  const parsed = updateSpellSchoolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttributes({
    "user.id": session.user.id,
    "spellSchool.id": parsed.data.id,
  });
  let school: SpellSchool;
  try {
    school = await updateSpellSchool({
      id: parsed.data.id,
      ...parsed.data.input,
      discordId: session.user.discordId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Spell school not found") {
      return NextResponse.json(
        { error: "Spell school not found" },
        { status: 404 }
      );
    }
    throw error;
  }
  revalidatePath(`/u/${session.user.username}`);
  revalidatePath("/my/spell-schools");
  revalidatePath(`/spell-schools/${school.id}`);
  revalidatePath("/spell-schools");
  const result: SpellSchoolMutationResult = {
    id: school.id,
    name: school.name,
  };
  return NextResponse.json(result);
});
