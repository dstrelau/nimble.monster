import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { RandomTableMutationResult } from "@/app/%5Factions/_random-tables/contract";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { internalAction } from "@/lib/internal-action";
import { RandomTableSchema } from "@/lib/random-table-schema";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import { isValidUUID } from "@/lib/utils/validation";

const saveRandomTableSchema = RandomTableSchema.extend({
  id: z.string().refine(isValidUUID, "Invalid random table ID").optional(),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id || !session.user.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isFeatureFlagEnabled(session.user.id, "random-tables"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = saveRandomTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { id, ...input } = parsed.data;
    const randomTable = id
      ? await db.updateRandomTable({
          id,
          ...input,
          discordId: session.user.discordId,
        })
      : await db.createRandomTable({
          ...input,
          discordId: session.user.discordId,
        });

    revalidatePath("/my/random-tables");
    if (id) revalidatePath("/random-tables/[id]", "page");

    const result: RandomTableMutationResult = {
      id: randomTable.id,
      name: randomTable.name,
    };
    return NextResponse.json(result, { status: id ? 200 : 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Random table not found") {
      return NextResponse.json(
        { error: "Random table not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
