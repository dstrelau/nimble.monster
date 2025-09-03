import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { findCompanion } from "@/lib/db";
import { createImageResponse } from "@/lib/image-route-handler";
import { isValidUUID } from "@/lib/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  const { companionId } = await params;

  if (!isValidUUID(companionId)) {
    return new Response("Companion not found", { status: 404 });
  }

  const companion = await findCompanion(companionId);

  if (!companion) {
    return new Response("Companion not found", { status: 404 });
  }

  // if companion is not public, then user must be creator
  if (companion.visibility !== "public") {
    const session = await auth();
    const isOwner = session?.user?.id === companion.creator?.discordId || false;
    if (!isOwner) {
      return new Response("Companion not found", { status: 404 });
    }
  }

  return createImageResponse(request, companion, "companion");
}
