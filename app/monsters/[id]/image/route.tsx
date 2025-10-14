import { permanentRedirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createImageResponse } from "@/lib/image-route-handler";
import { monstersService } from "@/lib/services/monsters";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterImageUrl } from "@/lib/utils/url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: monsterId } = await params;
  const uid = deslugify(monsterId);
  const monster = await monstersService.getMonster(uid);

  if (!monster || monster.visibility !== "public") {
    return new Response("Monster not found", { status: 404 });
  }
  if (monsterId !== slugify(monster)) {
    return permanentRedirect(getMonsterImageUrl(monster));
  }

  return createImageResponse(request, monster, "monster");
}
