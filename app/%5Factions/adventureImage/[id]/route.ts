import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteAdventureImageIfUnreferenced } from "@/lib/services/adventure-images";
import { telemetry } from "@/lib/telemetry";
import { isValidUUID } from "@/lib/utils/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const DELETE = telemetry(
  async (_request: Request, context: RouteContext) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
    }

    await deleteAdventureImageIfUnreferenced(id, session.user.id);
    return new NextResponse(null, { status: 204 });
  }
);
