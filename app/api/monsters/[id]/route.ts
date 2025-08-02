import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findPublicMonsterById, toMonster } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isValidUUID } from "@/lib/utils/validation";
import { telemetry } from "@/lib/telemetry";
import { trace } from "@opentelemetry/api";

export const GET = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    const monster = await findPublicMonsterById(id);

    if (!monster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    span?.setAttributes({ "monster.id": monster.id });
    return NextResponse.json(monster);
  }
);

export const PUT = telemetry(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const id = (await params).id;
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    span?.setAttributes({ "user.id": session.user.id });

    const existingMonster = await prisma.monster.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (
      !existingMonster ||
      existingMonster.creator.discordId !== session.user.id
    ) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    const monsterData = await request.json();

    const updatedMonster = await prisma.monster.update({
      where: { id },
      data: {
        name: monsterData.name,
        level: monsterData.level,
        hp: monsterData.hp,
        armor:
          monsterData.armor === "none" || !monsterData.armor
            ? "EMPTY_ENUM_VALUE"
            : monsterData.armor,
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

    revalidatePath(`/m/${id}`);
    revalidatePath(`/m/${id}/image`);

    span?.setAttributes({ "monster.id": updatedMonster.id });

    return NextResponse.json(toMonster(updatedMonster));
  }
);

export const DELETE = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const session = await auth();
    const id = (await params).id;
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    span?.setAttributes({ "user.id": session.user.id });

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
        { status: 403 }
      );
    }

    span?.setAttributes({ "monster.id": existingMonster.id });

    await prisma.monster.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  }
);
