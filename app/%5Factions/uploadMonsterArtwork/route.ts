import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { MONSTER_ARTWORK_MAX_FILE_SIZE } from "@/lib/monster-artwork";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import {
  MonsterArtworkInputError,
  uploadMonsterArtwork,
} from "@/lib/services/monster-artwork";

export const POST = internalAction("multipart/form-data", async (request) => {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isFeatureFlagEnabled(session.user.id, "monster-custom-artwork")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MONSTER_ARTWORK_MAX_FILE_SIZE + 64 * 1024
  )
    return NextResponse.json(
      { error: "Images must be 10 MB or smaller" },
      { status: 413 }
    );
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }
  const file = form.get("image");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "Choose an image to upload" },
      { status: 400 }
    );
  try {
    return NextResponse.json(
      await uploadMonsterArtwork(session.user.id, file),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof MonsterArtworkInputError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
});
