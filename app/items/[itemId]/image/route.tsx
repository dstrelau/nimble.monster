import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { findItem } from "@/lib/db";
import { createImageResponse } from "@/lib/image-route-handler";
import { isValidUUID } from "@/lib/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  if (!isValidUUID(itemId)) {
    return new Response("Item not found", { status: 404 });
  }

  const item = await findItem(itemId);

  if (!item) {
    return new Response("Item not found", { status: 404 });
  }

  // if item is not public, then user must be creator
  if (item.visibility !== "public") {
    const session = await auth();
    const isOwner = session?.user?.id === item.creator?.discordId || false;
    if (!isOwner) {
      return new Response("Item not found", { status: 404 });
    }
  }

  return createImageResponse(request, item, "item");
}
