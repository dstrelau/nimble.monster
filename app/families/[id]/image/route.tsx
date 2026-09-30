import { permanentRedirect } from "next/navigation";
import type { NextRequest } from "next/server";
import * as db from "@/lib/db";
import { createImageResponse } from "@/lib/image-route-handler";
import * as monstersRepo from "@/lib/services/monsters/repository";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getFamilyImageUrl } from "@/lib/utils/url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) {
    return new Response("Family not found", { status: 404 });
  }

  const family = await db.getFamily(uid);
  if (!family || family.visibility !== "public") {
    return new Response("Family not found", { status: 404 });
  }

  if (id !== slugify(family)) {
    const search = new URL(request.url).search;
    return permanentRedirect(`${getFamilyImageUrl(family)}${search}`);
  }

  const monsters = await monstersRepo.listMonstersByFamilyId(uid);
  return createImageResponse(request, { ...family, monsters }, "family");
}
