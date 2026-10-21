import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { deleteMonsterArtworkIfUnreferenced } from "@/lib/services/monster-artwork";

const inputSchema = z.strictObject({ id: z.uuid() });

export const DELETE = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid artwork ID" }, { status: 400 });
  // Cleanup remains available after the feature is disabled.
  const deleted = await deleteMonsterArtworkIfUnreferenced(
    parsed.data.id,
    session.user.id
  );
  if (!deleted)
    return NextResponse.json(
      { error: "Artwork is unavailable or still referenced" },
      { status: 409 }
    );
  return new NextResponse(null, { status: 204 });
});
