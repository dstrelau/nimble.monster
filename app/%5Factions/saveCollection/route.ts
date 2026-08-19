import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { EditorMutationResult } from "@/app/%5Factions/_editors/contract";
import { saveCollectionSchema } from "@/app/%5Factions/_editors/input";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
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
  const parsed = saveCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { id, ...input } = parsed.data;
    let collection: Awaited<ReturnType<typeof db.updateCollection>>;
    if (id) {
      collection = await db.updateCollection({
        id,
        ...input,
        discordId: session.user.discordId,
      });
    } else {
      const created = await db.createCollection({
        name: input.name,
        description: input.description,
        visibility: input.visibility,
        discordId: session.user.discordId,
      });
      collection = await db.updateCollection({
        id: created.id,
        ...input,
        discordId: session.user.discordId,
      });
    }

    revalidatePath("/my/collections");
    if (id) revalidatePath("/collections/[id]", "page");
    trace.getActiveSpan()?.setAttributes({
      "collection.id": collection.id,
      "user.id": session.user.id,
    });
    const result: EditorMutationResult = {
      id: collection.id,
      name: collection.name,
    };
    return NextResponse.json(result, { status: id ? 200 : 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Collection not found") {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
