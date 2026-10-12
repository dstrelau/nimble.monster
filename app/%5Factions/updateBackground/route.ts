import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { BackgroundMutationResult } from "@/app/%5Factions/_background/contract";
import { updateBackgroundSchema } from "@/app/%5Factions/_background/input";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { backgroundsService } from "@/lib/services/backgrounds/service";
import { getBackgroundUrl } from "@/lib/utils/url";

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id || !session.user.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = updateBackgroundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const background = await backgroundsService.updateBackground(
      parsed.data.id,
      parsed.data.input,
      session.user.discordId
    );
    revalidatePath(getBackgroundUrl(background));
    revalidatePath("/backgrounds");
    revalidatePath("/my/backgrounds");
    trace.getActiveSpan()?.setAttributes({
      "background.id": background.id,
      "user.id": session.user.id,
    });
    const result: BackgroundMutationResult = {
      id: background.id,
      name: background.name,
    };
    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Background not found or not owned by user"
    ) {
      return NextResponse.json(
        { error: "Background not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
