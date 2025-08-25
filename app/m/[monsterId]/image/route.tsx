import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { findMonster } from "@/lib/db";
import { generateEntityImage } from "@/lib/image-generation";
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

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = new URL(request.url).protocol;
  const baseUrl = `${protocol}//${host}`;

  try {
    const imageBuffer = await generateEntityImage({
      baseUrl,
      entityId: monster.id,
      entityType: "monster",
    });

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${monster.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.png"`,
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    console.error("Error generating monster image:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Error generating image: ${errorMessage}`, {
      status: 500,
    });
  }
}
