import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  listLibraryConditions,
  updateConditionDescription,
} from "@/lib/db/condition";
import { internalAction } from "@/lib/internal-action";

const idSchema = z.uuid();
const updateSchema = z.object({
  id: idSchema,
  description: z.string().trim().min(1),
});

export const GET = internalAction(null, async (request) => {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = idSchema.safeParse(
    new URL(request.url).searchParams.get("id")
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid condition ID" },
      { status: 400 }
    );
  const conditions = await listLibraryConditions(session.user.id);
  const condition = conditions.find(
    (condition) => condition.id === parsed.data
  );
  if (!condition)
    return NextResponse.json({ error: "Condition not found" }, { status: 404 });
  return NextResponse.json(condition.usage, {
    headers: { "Cache-Control": "private, no-store" },
  });
});

export const PATCH = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid condition ID or description" },
      { status: 400 }
    );
  trace.getActiveSpan()?.setAttributes({
    "condition.id": parsed.data.id,
    "user.id": session.user.id,
  });
  const updated = await updateConditionDescription(
    parsed.data.id,
    session.user.id,
    parsed.data.description
  );
  if (!updated)
    return NextResponse.json({ error: "Condition not found" }, { status: 404 });
  revalidatePath("/my", "layout");
  return NextResponse.json({ success: true });
});
