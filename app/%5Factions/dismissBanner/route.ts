import { trace } from "@opentelemetry/api";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { internalAction } from "@/lib/internal-action";

const inputSchema = z.object({});

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
  if (!inputSchema.safeParse(body).success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttributes({ "user.id": session.user.id });
  await getDatabase()
    .update(users)
    .set({ bannerDismissed: true })
    .where(eq(users.id, session.user.id));
  return NextResponse.json({ success: true });
});
