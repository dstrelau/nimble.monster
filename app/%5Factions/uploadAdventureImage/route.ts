import { NextResponse } from "next/server";
import { ADVENTURE_IMAGE_MAX_FILE_SIZE } from "@/lib/adventure-images";
import { auth } from "@/lib/auth";
import { uploadAdventureImage } from "@/lib/services/adventure-images";
import { telemetry } from "@/lib/telemetry";

export const POST = telemetry(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > ADVENTURE_IMAGE_MAX_FILE_SIZE + 64 * 1024
  ) {
    return NextResponse.json(
      { error: "Images must be 10 MB or smaller" },
      { status: 413 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose an image to upload" },
        { status: 400 }
      );
    }
    const image = await uploadAdventureImage(session.user.id, file);
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not upload image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
