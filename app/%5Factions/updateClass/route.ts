import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { ClassMutationResult } from "@/app/%5Factions/_class/contract";
import { updateClassSchema } from "@/app/%5Factions/_class/input";
import { auth } from "@/lib/auth";
import { updateClass } from "@/lib/db/class";
import { internalAction } from "@/lib/internal-action";
import { getClassUrl } from "@/lib/utils/url";

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
  const parsed = updateClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  try {
    const classEntity = await updateClass({
      id: parsed.data.id,
      ...parsed.data.input,
      discordId: session.user.discordId,
    });
    revalidatePath(getClassUrl(classEntity));
    revalidatePath("/classes");
    revalidatePath("/my/classes");
    trace.getActiveSpan()?.setAttributes({
      "class.id": classEntity.id,
      "user.id": session.user.id,
    });
    const result: ClassMutationResult = {
      id: classEntity.id,
      name: classEntity.name,
    };
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Class not found") {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    throw error;
  }
});
