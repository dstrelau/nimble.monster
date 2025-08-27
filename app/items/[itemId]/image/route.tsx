import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { findItem } from "@/lib/db";
import { generateEntityImage } from "@/lib/image-generation";
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

  if (!item) {
    return new Response("Item not found", { status: 404 });
  }

  // if item is not public, then user must be creator
  if (item.visibility !== "public") {
    const session = await auth();
    const isOwner = session?.user?.id === item.creator?.discordId || false;
    if (!isOwner) {
      return new Response("Item not found", { status: 404 });
    }
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = new URL(request.url).protocol;
  const baseUrl = `${protocol}//${host}`;

  try {
    const imageBuffer = await generateEntityImage({
      baseUrl,
      entityId: item.id,
      entityType: "item",
    });

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${item.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.png"`,
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    console.error("Error generating item image:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Error generating image: ${errorMessage}`, {
      status: 500,
    });
  }
}
