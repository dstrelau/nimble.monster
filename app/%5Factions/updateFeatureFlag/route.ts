import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { getUserById } from "@/lib/db/user";
import { internalAction } from "@/lib/internal-action";
import { FEATURE_FLAGS, setFeatureFlag } from "@/lib/services/featureFlags";

const inputSchema = z.object({
  userId: z.string().min(1),
  feature: z.enum(FEATURE_FLAGS),
  enabled: z.boolean(),
});

export const POST = internalAction("application/json", async (request) => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid feature flag input" },
      { status: 400 }
    );
  }
  const { userId, feature, enabled } = parsed.data;
  if (!(await getUserById(userId))) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  trace.getActiveSpan()?.setAttributes({
    "feature_flag.user_id": userId,
    "feature_flag.name": feature,
    "feature_flag.enabled": enabled,
  });
  await setFeatureFlag(userId, feature, enabled);
  revalidatePath("/admin/feature-flags");
  return NextResponse.json({ success: true });
});
