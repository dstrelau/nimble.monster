import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const families = await db.getUserFamilies(session.user.id);
  return NextResponse.json({ families });
}
