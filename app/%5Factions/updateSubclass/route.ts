import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { SubclassMutationResult } from "@/app/%5Factions/_subclass/contract";
import { updateSubclassSchema } from "@/app/%5Factions/_subclass/input";
import { auth } from "@/lib/auth";
import { updateSubclass } from "@/lib/db/subclass";
import { internalAction } from "@/lib/internal-action";
import { getSubclassUrl } from "@/lib/utils/url";

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
  const parsed = updateSubclassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  try {
    const subclass = await updateSubclass({
      id: parsed.data.id,
      ...parsed.data.input,
      discordId: session.user.discordId,
    });
    revalidatePath(getSubclassUrl(subclass));
    revalidatePath("/subclasses");
    revalidatePath("/my/subclasses");
    trace.getActiveSpan()?.setAttributes({
      "subclass.id": subclass.id,
      "user.id": session.user.id,
    });
    const result: SubclassMutationResult = {
      id: subclass.id,
      name: subclass.name,
      namePreface: subclass.namePreface,
    };
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Subclass not found") {
      return NextResponse.json(
        { error: "Subclass not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
