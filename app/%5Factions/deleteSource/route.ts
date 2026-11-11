import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminJsonAction, isSqliteConstraint } from "@/lib/admin-action";
import { deleteSource } from "@/lib/db/source";
import { sourceIdSchema } from "../_source/input";

export const POST = adminJsonAction(
  z.object({ id: sourceIdSchema }),
  async ({ id }) => {
    let deleted: boolean;
    try {
      deleted = await deleteSource(id);
    } catch (error) {
      if (isSqliteConstraint(error, "SQLITE_CONSTRAINT_FOREIGNKEY")) {
        return NextResponse.json(
          { error: "This source is still used by content" },
          { status: 409 }
        );
      }
      throw error;
    }
    if (!deleted) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    revalidatePath("/admin/sources");
    return NextResponse.json({ success: true });
  }
);
