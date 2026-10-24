import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  createCondition,
  listConditionsForDiscordId,
} from "@/lib/db/condition";
import { internalAction } from "@/lib/internal-action";

const inputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[^[\]|\r\n]+$/),
  description: z.string().trim().min(1),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttributes({ "user.id": session.user.id });
  const { name, description } = parsed.data;
  const existing = await listConditionsForDiscordId(session.user.discordId);
  if (
    existing.some(
      (condition) => condition.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return NextResponse.json(
      { error: "A condition with this name already exists" },
      { status: 409 }
    );
  }
  const condition = await createCondition(
    session.user.discordId,
    name,
    description
  );
  trace.getActiveSpan()?.setAttributes({ "condition.id": condition.id });
  revalidatePath("/my", "layout");
  return NextResponse.json({ success: true }, { status: 201 });
});
