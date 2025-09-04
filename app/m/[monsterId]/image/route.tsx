import type { NextRequest } from "next/server";
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

  if (!monster || monster.visibility !== "public") {
    return new Response("Monster not found", { status: 404 });
  }

  return createImageResponse(request, monster, "monster");
}
