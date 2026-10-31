import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { DRAFT_ENTITY_TYPES, draftsService } from "@/lib/services/drafts";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };
const inputSchema = z.object({
  entityType: z.enum(DRAFT_ENTITY_TYPES),
  entityId: z.uuid().nullable(),
});
// Drafts deliberately accept incomplete editor fields, not published input.
const saveSchema = inputSchema.extend({ data: z.record(z.string(), z.json()) });

async function handle(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.discordId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401, headers }
    );
  }
  if (!(await isFeatureFlagEnabled(session.user.id, "draft-autosave"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  }
  trace.getActiveSpan()?.setAttribute("user.id", session.user.id);

  let body: unknown;
  if (request.method === "GET") {
    const params = new URL(request.url).searchParams;
    body = {
      entityType: params.get("entityType"),
      entityId: params.get("entityId"),
    };
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers }
      );
    }
  }
  const parsed = (
    request.method === "POST" ? saveSchema : inputSchema
  ).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid draft input" },
      { status: 400, headers }
    );
  }
  const { entityType, entityId } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "draft.entityType": entityType,
    "draft.entityId": entityId ?? "__new__",
  });
  const discordId = session.user.discordId;
  if (request.method === "GET") {
    const draft = await draftsService.get(discordId, entityType, entityId);
    return NextResponse.json(
      {
        draft: draft
          ? { data: draft.data, updatedAt: draft.updatedAt.toISOString() }
          : null,
      },
      { headers }
    );
  }
  if (request.method === "POST" && "data" in parsed.data) {
    const draft = await draftsService.save(
      discordId,
      entityType,
      entityId,
      parsed.data.data
    );
    if (!draft) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers }
      );
    }
    return NextResponse.json(
      { updatedAt: draft.updatedAt.toISOString() },
      { headers }
    );
  }
  await draftsService.delete(discordId, entityType, entityId);
  return NextResponse.json({ success: true }, { headers });
}

const read = telemetry(handle);
export async function GET(request: Request) {
  try {
    return await read(request);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers }
    );
  }
}
export const POST = internalAction("application/json", handle);
export const DELETE = internalAction("application/json", handle);
