import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { generateCompendiumPack } from "@/lib/export";
import { deslugify } from "@/lib/utils/slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const uid = deslugify(id);

  try {
    // Get the collection using the existing db function
    const collection = await db.getCollection(uid, session?.user?.discordId);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Check if collection is private and user isn't the owner
    if (
      collection.visibility === "private" &&
      session?.user?.discordId !== collection.creator.discordId
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Use the export module to convert to OBR format
    const compendiumPack = generateCompendiumPack(collection);

    // Return the JSON data with appropriate headers
    return NextResponse.json(compendiumPack, {
      headers: {
        // Set content disposition header to suggest filename for download
        "Content-Disposition": `attachment; filename="collection-${collection.id}.json"`,
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
