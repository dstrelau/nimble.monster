import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { ItemMutationResult } from "@/app/%5Factions/_item/contract";
import { createItemSchema } from "@/app/%5Factions/_item/input";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { itemsService } from "@/lib/services/items";

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
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const item = await itemsService.createItem(
      parsed.data,
      session.user.discordId
    );
    revalidatePath("/my/items");
    trace.getActiveSpan()?.setAttributes({
      "item.id": item.id,
      "user.id": session.user.id,
    });
    const result: ItemMutationResult = { id: item.id, name: item.name };
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Item name is required") {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
});
