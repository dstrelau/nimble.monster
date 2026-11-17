import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { getUserById } from "@/lib/db/user";
import { internalAction } from "@/lib/internal-action";
import { PERMISSIONS, setPermission } from "@/lib/services/permissions";

const inputSchema = z.object({
  userId: z.string().min(1),
  permission: z.enum(PERMISSIONS),
  granted: z.boolean(),
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
      { error: "Invalid permission input" },
      { status: 400 }
    );
  }
  const { userId, permission, granted } = parsed.data;
  if (!(await getUserById(userId))) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  trace.getActiveSpan()?.setAttributes({
    "permission.user_id": userId,
    "permission.name": permission,
    "permission.granted": granted,
  });
  await setPermission(userId, permission, granted);
  revalidatePath("/admin/permissions");
  return NextResponse.json({ success: true });
});
