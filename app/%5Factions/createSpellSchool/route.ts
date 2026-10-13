import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { SpellSchoolMutationResult } from "@/app/%5Factions/_spellSchool/contract";
import { spellSchoolInputSchema } from "@/app/%5Factions/_spellSchool/input";
import { auth } from "@/lib/auth";
import { createSpellSchool } from "@/lib/db/school";
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
  const parsed = spellSchoolInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttribute("user.id", session.user.id);
  const school = await createSpellSchool({
    ...parsed.data,
    discordId: session.user.discordId,
  });
  trace.getActiveSpan()?.setAttribute("spellSchool.id", school.id);
  revalidatePath("/my/spell-schools");
  revalidatePath("/spell-schools");
  const result: SpellSchoolMutationResult = {
    id: school.id,
    name: school.name,
  };
  return NextResponse.json(result, { status: 201 });
});
