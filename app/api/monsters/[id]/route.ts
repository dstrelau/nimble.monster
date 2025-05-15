import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findPublicMonsterById, toMonster } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const monster = await findPublicMonsterById(id);

    if (!monster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    return NextResponse.json(monster);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve monster" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const id = (await params).id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingMonster = await prisma.monster.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!existingMonster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    if (existingMonster.creator.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this monster" },
        { status: 403 },
      );
    }

    const monsterData = await request.json();

    const updatedMonster = await prisma.monster.update({
      where: { id },
      data: {
        name: monsterData.name,
        level: monsterData.level,
        hp: monsterData.hp,
        armor: monsterData.armor,
        size: monsterData.size,
        speed: monsterData.speed,
        fly: monsterData.fly,
        swim: monsterData.swim,
        actions: monsterData.actions,
        abilities: monsterData.abilities,
        legendary: monsterData.legendary,
        bloodied: monsterData.bloodied || "",
        lastStand: monsterData.lastStand || "",
        saves: Array.isArray(monsterData.saves)
          ? monsterData.saves
          : monsterData.saves
            ? [monsterData.saves]
            : [],
        kind: monsterData.kind || "",
        visibility: monsterData.visibility,
        actionPreface: monsterData.actionPreface || "",
        moreInfo: monsterData.moreInfo || "",
        family_id: monsterData.family?.id || null,
      },
      include: {
        family: true,
        creator: true,
      },
    });

    return NextResponse.json(toMonster(updatedMonster));
  } catch {
    return NextResponse.json(
      { error: "Failed to update monster" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const id = (await params).id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingMonster = await prisma.monster.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!existingMonster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    if (existingMonster.creator.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this monster" },
        { status: 403 },
      );
    }

    await prisma.monster.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete monster" },
      { status: 500 },
    );
  }
}
