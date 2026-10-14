import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import { classDraftsService } from "@/lib/services/classdrafts";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import { telemetry } from "@/lib/telemetry";

const headers = { "Cache-Control": "private, no-store" };
const inputSchema = z.object({ classId: z.uuid().nullable() });
// Drafts deliberately accept incomplete editor fields, not published-class input.
const saveSchema = inputSchema.extend({ data: z.record(z.string(), z.json()) });

async function handle(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.discordId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401, headers }
    );
  }
  if (!(await isFeatureFlagEnabled(session.user.id, "class-draft-autosave"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  }
  trace.getActiveSpan()?.setAttribute("user.id", session.user.id);

  let body: unknown;
  if (request.method === "GET") {
    body = { classId: new URL(request.url).searchParams.get("classId") };
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
      { error: "Invalid class draft input" },
      { status: 400, headers }
    );
  }
  const { classId } = parsed.data;
  trace
    .getActiveSpan()
    ?.setAttribute("classDraft.classId", classId ?? "__new__");
  if (request.method === "GET") {
    const draft = await classDraftsService.get(session.user.discordId, classId);
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
    const draft = await classDraftsService.save(
      session.user.discordId,
      classId,
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
  await classDraftsService.delete(session.user.discordId, classId);
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
