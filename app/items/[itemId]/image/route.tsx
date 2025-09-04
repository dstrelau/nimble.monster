import type { NextRequest } from "next/server";
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

  if (!item || item.visibility !== "public") {
    return new Response("Item not found", { status: 404 });
  }
  return createImageResponse(request, item, "item");
}
