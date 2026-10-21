import { trace } from "@opentelemetry/api";
import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addCompanionToCollection, getCollection } from "@/lib/db";
import { getDatabase } from "@/lib/db/drizzle";
import { companions } from "@/lib/db/schema";
import { internalAction } from "@/lib/internal-action";
import { isValidUUID } from "@/lib/utils/validation";

const inputSchema = z.object({
  companionId: z.string().refine(isValidUUID, "Invalid companion ID"),
  collectionId: z.string().refine(isValidUUID, "Invalid collection ID"),
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
  const { collectionId, companionId } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "collection.id": collectionId,
    "companion.id": companionId,
    "user.id": session.user.id,
  });
  const collection = await getCollection(collectionId, session.user.discordId);
  if (!collection) {
    return NextResponse.json(
      {
        error: "Collection not found or you don't have permission to update it",
      },
      { status: 404 }
    );
  }
  if (collection.creator.discordId !== session.user.discordId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const accessible = await getDatabase()
    .select({ id: companions.id })
    .from(companions)
    .where(
      and(
        eq(companions.id, companionId),
        or(
          eq(companions.visibility, "public"),
          eq(companions.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await addCompanionToCollection({ companionId, collectionId });
  revalidatePath("/my/collections");
  revalidatePath("/collections");
  revalidatePath("/collections/[id]", "page");
  return NextResponse.json({ success: true });
});
