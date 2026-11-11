import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminJsonAction } from "@/lib/admin-action";
import { updateSource } from "@/lib/db/source";
import { sourceIdSchema, sourceInputSchema } from "../_source/input";

export const POST = adminJsonAction(
  sourceInputSchema.extend({ id: sourceIdSchema }),
  async ({ id, ...input }) => {
    if (!(await updateSource(id, input))) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    revalidatePath("/admin/sources");
    return NextResponse.json({ success: true });
  }
);
