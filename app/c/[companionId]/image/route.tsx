import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { findCompanion } from "@/lib/db";
import { generateEntityImage } from "@/lib/image-generation";
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

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = new URL(request.url).protocol;
  const baseUrl = `${protocol}//${host}`;

  try {
    const imageBuffer = await generateEntityImage({
      baseUrl,
      entityId: companion.id,
      entityType: "companion",
    });

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${companion.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.png"`,
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    console.error("Error generating companion image:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Error generating image: ${errorMessage}`, {
      status: 500,
    });
  }
}
