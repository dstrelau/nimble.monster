import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createMonster } from "@/lib/db";
import type { CreateMonsterInput } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const monsterData = await request.json();

    // Add the user's Discord ID from the session
    const input: CreateMonsterInput = {
      ...monsterData,
      discordId: session.user.id,
    };

    const newMonster = await createMonster(input);

    return NextResponse.json(newMonster, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create monster" },
      { status: 500 },
    );
  }
}
