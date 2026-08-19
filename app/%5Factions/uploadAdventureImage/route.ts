import { NextResponse } from "next/server";
import { ADVENTURE_IMAGE_MAX_FILE_SIZE } from "@/lib/adventure-images";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import {
  AdventureImageInputError,
  uploadAdventureImage,
} from "@/lib/services/adventure-images";

export const POST = internalAction("multipart/form-data", async (request) => {
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  try {
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
    if (error instanceof AdventureImageInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
});
