import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminJsonAction, isSqliteConstraint } from "@/lib/admin-action";
import { createAward } from "@/lib/db/award";
import { awardSlugify } from "@/lib/utils/slug";
import { awardInputSchema, duplicateAwardError } from "../_award/input";

export const POST = adminJsonAction(awardInputSchema, async (input) => {
  try {
    await createAward({ ...input, slug: awardSlugify(input.abbreviation) });
  } catch (error) {
    if (isSqliteConstraint(error, "SQLITE_CONSTRAINT_UNIQUE")) {
      return NextResponse.json(duplicateAwardError, { status: 409 });
    }
    throw error;
  }
  revalidatePath("/admin/awards");
  return NextResponse.json({ success: true });
});
