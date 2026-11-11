import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminJsonAction } from "@/lib/admin-action";
import { deleteAward } from "@/lib/db/award";
import { awardIdSchema } from "../_award/input";

export const POST = adminJsonAction(
  z.object({ id: awardIdSchema }),
  async ({ id }) => {
    if (!(await deleteAward(id))) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }
    revalidatePath("/admin/awards");
    return NextResponse.json({ success: true });
  }
);
