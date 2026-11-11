import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminJsonAction, isSqliteConstraint } from "@/lib/admin-action";
import { updateAward } from "@/lib/db/award";
import { awardSlugify } from "@/lib/utils/slug";
import {
  awardIdSchema,
  awardInputSchema,
  duplicateAwardError,
} from "../_award/input";

export const POST = adminJsonAction(
  awardInputSchema.extend({ id: awardIdSchema }),
  async ({ id, ...input }) => {
    let updated: unknown;
    try {
      updated = await updateAward(id, {
        ...input,
        slug: awardSlugify(input.abbreviation),
      });
    } catch (error) {
      if (isSqliteConstraint(error, "SQLITE_CONSTRAINT_UNIQUE")) {
        return NextResponse.json(duplicateAwardError, { status: 409 });
      }
      throw error;
    }
    if (!updated) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }
    revalidatePath("/admin/awards");
    return NextResponse.json({ success: true });
  }
);
