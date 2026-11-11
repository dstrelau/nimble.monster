import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminJsonAction } from "@/lib/admin-action";
import { createSource } from "@/lib/db/source";
import { sourceInputSchema } from "../_source/input";

export const POST = adminJsonAction(sourceInputSchema, async (input) => {
  await createSource(input);
  revalidatePath("/admin/sources");
  return NextResponse.json({ success: true });
});
