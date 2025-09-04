import type { NextRequest } from "next/server";
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

  if (!companion || companion.visibility !== "public") {
    return new Response("Companion not found", { status: 404 });
  }

  return createImageResponse(request, companion, "companion");
}
