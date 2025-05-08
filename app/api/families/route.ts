import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { auth } from "@/lib/auth";
import { Ability } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const input: { name: string; abilities: Ability[] } = await req.json();
  const families = await db.createFamily({
    ...input,
    discordId: session.user.id,
  });
  return NextResponse.json({ families });
}
