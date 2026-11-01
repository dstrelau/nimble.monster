import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import {
  SELF_SERVICE_FEATURE_FLAGS,
  setFeatureFlag,
} from "@/lib/services/featureFlags";

const inputSchema = z.object({
  feature: z.enum(SELF_SERVICE_FEATURE_FLAGS),
  enabled: z.boolean(),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
  const { feature, enabled } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "user.id": session.user.id,
    "feature_flag.name": feature,
    "feature_flag.enabled": enabled,
  });
  await setFeatureFlag(session.user.id, feature, enabled);
  return NextResponse.json({ success: true });
});
