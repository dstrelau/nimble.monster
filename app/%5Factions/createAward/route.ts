import { LibsqlError } from "@libsql/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAward } from "@/lib/db/award";
import { internalAction } from "@/lib/internal-action";
import { awardSlugify } from "@/lib/utils/slug";

const awardInputSchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().min(1),
  description: z.string().default(""),
  url: z.url(),
  color: z.string().min(1),
  icon: z.string().min(1),
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = awardInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  try {
    await createAward({
      ...parsed.data,
      slug: awardSlugify(parsed.data.abbreviation),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.cause instanceof LibsqlError &&
      error.cause.extendedCode === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return NextResponse.json(
        { error: "An award with this abbreviation already exists" },
        { status: 409 }
      );
    }
    throw error;
  }
  revalidatePath("/admin/awards");
  return NextResponse.json({ success: true });
});
