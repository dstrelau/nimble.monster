import { permanentRedirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { findCompanion } from "@/lib/db";
import { createImageResponse } from "@/lib/image-route-handler";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCompanionImageUrl } from "@/lib/utils/url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  const { companionId } = await params;
  const uid = deslugify(companionId);
  const companion = await findCompanion(uid);

  if (!companion || companion.visibility !== "public") {
    return new Response("Companion not found", { status: 404 });
  }
  if (companionId !== slugify(companion)) {
    return permanentRedirect(getCompanionImageUrl(companion));
  }
  return createImageResponse(request, companion, "companion");
}
