import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, toMonster } from "@/lib/db";
import {
  extractAllConditions,
  syncMonsterConditions,
} from "@/lib/db/monster-conditions";
import { telemetry } from "@/lib/telemetry";
import { isValidUUID } from "@/lib/utils/validation";

export const PUT = telemetry(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const id = (await params).id;
      const span = trace.getActiveSpan();

      span?.setAttributes({ "params.id": id });

      if (!isValidUUID(id)) {
        return NextResponse.json(
          { error: "Monster not found" },
          { status: 404 }
        );
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
        return NextResponse.json(
          { error: "Monster not found" },
          { status: 404 }
        );
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
          climb: monsterData.climb,
          teleport: monsterData.teleport,
          burrow: monsterData.burrow,
          actions: monsterData.actions,
          abilities: monsterData.abilities,
          legendary: monsterData.legendary,
          minion: monsterData.minion || false,
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
          family: { include: { creator: true } },
          creator: true,
          monsterConditions: { include: { condition: true } },
        },
      });

      const conditionNames = extractAllConditions({
        actions: monsterData.actions || [],
        abilities: monsterData.abilities || [],
        bloodied: monsterData.bloodied || "",
        lastStand: monsterData.lastStand || "",
        moreInfo: monsterData.moreInfo || "",
      });

      await syncMonsterConditions(id, conditionNames);

      revalidatePath(`/m/${id}`);
      revalidatePath(`/m/${id}/image`);

      span?.setAttributes({ "monster.id": updatedMonster.id });

      return NextResponse.json(toMonster(updatedMonster));
    } catch (error) {
      console.error("Error in PUT /api/monsters/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
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
