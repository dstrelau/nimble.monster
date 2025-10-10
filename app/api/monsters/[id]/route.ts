import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { monstersService } from "@/lib/services/monsters";
import { toJsonApiMonster } from "@/lib/services/monsters/converters";
import { telemetry } from "@/lib/telemetry";
import { deslugify } from "@/lib/utils/slug";
import { getMonsterUrl } from "@/lib/utils/url";

const CONTENT_TYPE = "application/vnd.api+json";

export const GET = telemetry(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    try {
      const uid = deslugify(id);
      const monster = await monstersService.getMonster(uid);

      if (!monster) {
        return NextResponse.json(
          {
            errors: [
              {
                status: "404",
                title: "Monster not found",
              },
            ],
          },
          { status: 404, headers: { "Content-Type": CONTENT_TYPE } }
        );
      }

      span?.setAttributes({ "monster.id": monster.id });

      const data = toJsonApiMonster(monster);

      return NextResponse.json(
        { data },
        {
          headers: {
            "Content-Type": CONTENT_TYPE,
          },
        }
      );
    } catch (error) {
      span?.setAttributes({ "error": String(error) });
      return NextResponse.json(
        {
          errors: [
            {
              status: "404",
              title: "Monster not found",
            },
          ],
        },
        { status: 404, headers: { "Content-Type": CONTENT_TYPE } }
      );
    }
  }
);

export const PUT = telemetry(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const uid = deslugify(id);
      const span = trace.getActiveSpan();

      span?.setAttributes({ "params.id": id });

      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      span?.setAttributes({ "user.id": session.user.id });

      const existingMonster = await monstersService.getMonsterInternal(uid);

      if (
        !existingMonster ||
        existingMonster.creator.discordId !== session.user.discordId
      ) {
        return NextResponse.json(
          { error: "Monster not found" },
          { status: 404 }
        );
      }

      const monsterData = await request.json();

      const monster = await monstersService.updateMonster(
        {
          id: existingMonster.id,
          name: monsterData.name,
          level: monsterData.level,
          levelInt: monsterData.levelInt,
          hp: monsterData.hp,
          armor: monsterData.armor,
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
          family: monsterData.family,
        },
        session.user.discordId
      );

      revalidatePath(getMonsterUrl(monster));
      revalidatePath(`${getMonsterUrl(monster)}/image`);

      span?.setAttributes({ "monster.id": monster.id });

      return NextResponse.json(monster);
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
    const { id } = await params;
    const uid = deslugify(id);
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    span?.setAttributes({ "user.id": session.user.id });

    const existingMonster = await monstersService.getMonsterInternal(uid);

    if (!existingMonster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    if (existingMonster.creator.discordId !== session.user.discordId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this monster" },
        { status: 403 }
      );
    }

    span?.setAttributes({ "monster.id": existingMonster.id });

    await prisma.monster.delete({
      where: { id: existingMonster.id },
    });

    return new NextResponse(null, { status: 204 });
  }
);
