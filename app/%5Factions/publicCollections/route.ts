import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PublicCollectionPageSchema,
  publicCollectionPage,
} from "@/lib/services/collections/service";
import { telemetry } from "@/lib/telemetry";

const schema = PublicCollectionPageSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(12),
  pageParam: z.coerce
    .number()
    .int()
    .min(0)
    .max(Math.floor(Number.MAX_SAFE_INTEGER / 100))
    .default(0),
});
const headers = { "Cache-Control": "private, no-store" };
const read = telemetry(async (request: Request) => {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid collection search" },
      { status: 400, headers }
    );
  return NextResponse.json(await publicCollectionPage(parsed.data), {
    headers,
  });
});

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
