import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = (await params).id;
  if (id) {
    const deleted = await db.deleteFamily({
      id,
      discordId: session.user.id,
    });
    if (deleted) return new Response(null, { status: 204 });
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = (await params).id;
  if (id) {
    const { name, abilities } = await req.json();
    const updated = await db.updateFamily({
      id,
      name,
      abilities,
      discordId: session.user.id,
    });
    if (updated) return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
