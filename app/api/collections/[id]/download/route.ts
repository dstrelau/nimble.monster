import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { generateCompendiumPack } from "@/lib/export";
import { isValidUUID } from "@/lib/utils/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const id = (await params).id;

  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }

  try {
    // Get the collection using the existing db function
    const collection = await db.getCollection(id);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Check if collection is private and user isn't the owner
    if (
      collection.visibility === "private" &&
      session?.user?.id !== collection.creator.discordId
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Use the export module to convert to OBR format
    const compendiumPack = generateCompendiumPack(collection);

    // Set content disposition header to suggest filename for download
    return NextResponse.json(compendiumPack, {
      headers: {
        "Content-Disposition": `attachment; filename="collection-${id}.json"`,
      },
    });
  } catch (error) {
    console.error("Error downloading collection:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}
