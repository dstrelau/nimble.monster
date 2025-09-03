import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { findMonster } from "@/lib/db";
import { createImageResponse } from "@/lib/image-route-handler";
import { isValidUUID } from "@/lib/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ monsterId: string }> }
) {
  const { monsterId } = await params;

  if (!isValidUUID(monsterId)) {
    return new Response("Monster not found", { status: 404 });
  }

  const monster = await findMonster(monsterId);

  if (!monster) {
    return new Response("Monster not found", { status: 404 });
  }

  // if monster is not public, then user must be creator
  if (monster.visibility !== "public") {
    const session = await auth();
    const isOwner = session?.user?.id === monster.creator?.discordId || false;
    if (!isOwner) {
      return new Response("Monster not found", { status: 404 });
    }
  }

  return createImageResponse(request, monster, "monster");
}
