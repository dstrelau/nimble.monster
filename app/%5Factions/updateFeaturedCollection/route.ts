import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";
import {
  MONSTERY_MONDAY,
  setCollectionFeatured,
} from "@/lib/services/collections/queries";

const inputSchema = z.object({
  collectionId: z.string().min(1),
  featured: z.boolean(),
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
      { error: "Invalid featured collection input" },
      { status: 400 }
    );
  }
  const { collectionId, featured } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "featured_collection.collection_id": collectionId,
    "featured_collection.featured": featured,
  });
  const result = await setCollectionFeatured(
    collectionId,
    MONSTERY_MONDAY,
    featured
  );
  if (result === "not-found") {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }
  if (result === "conflict") {
    return NextResponse.json(
      { error: "Collection is featured in another group" },
      { status: 409 }
    );
  }
  revalidatePath("/admin/monstery-monday");
  revalidatePath("/monstery-monday");
  return NextResponse.json({ success: true });
});
