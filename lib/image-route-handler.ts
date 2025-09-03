import type { NextRequest } from "next/server";
import { generateEntityImage } from "@/lib/image-generation";

type Entity = {
  id: string;
  name: string;
  updatedAt: Date | string;
};

type EntityType = "monster" | "companion" | "item";

export async function createImageResponse(
  request: NextRequest,
  entity: Entity,
  entityType: EntityType
): Promise<Response> {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = new URL(request.url).protocol;
  const baseUrl = `${protocol}//${host}`;

  try {
    const version = new Date(entity.updatedAt).getTime().toString();
    const etag = `"${version}"`;

    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    const imageBuffer = await generateEntityImage({
      baseUrl,
      entityId: entity.id,
      entityType,
    });

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${entity.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.png"`,
        ETag: etag,
        "Cache-Control": "public, max-age=30, must-revalidate",
      },
    });
  } catch (error: unknown) {
    console.error(`Error generating ${entityType} image:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Error generating image: ${errorMessage}`, {
      status: 500,
    });
  }
}
