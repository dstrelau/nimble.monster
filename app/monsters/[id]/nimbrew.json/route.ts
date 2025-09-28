import { trace } from "@opentelemetry/api";
import { permanentRedirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findMonster } from "@/lib/db";
import { telemetry } from "@/lib/telemetry";
import { formatSizeKind } from "@/lib/utils/monster";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterUrl } from "@/lib/utils/url";

export const GET = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: monsterId } = await params;
    const span = trace.getActiveSpan();
    span?.setAttributes({ "params.id": monsterId });

    let uid: string;
    try {
      uid = deslugify(monsterId);
    } catch {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    const monster = await findMonster(uid);

    if (!monster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }
    if (monsterId !== slugify(monster)) {
      return permanentRedirect(`${getMonsterUrl(monster)}/nimbrew.json`);
    }

    // if monster is not public, then user must be creator
    if (monster.visibility !== "public") {
      const session = await auth();
      const isOwner =
        session?.user?.discordId === monster.creator?.discordId || false;
      if (!isOwner) {
        return NextResponse.json(
          { error: "Monster not found" },
          { status: 404 }
        );
      }
    }

    span?.setAttributes({ "monster.id": monster.id });

    const speedParts = [];
    if (monster.speed && monster.speed !== 6)
      speedParts.push(monster.speed.toString());
    if (monster.swim) speedParts.push(`Swim ${monster.swim}`);
    if (monster.fly) speedParts.push(`Fly ${monster.fly}`);
    if (monster.climb) speedParts.push(`Climb ${monster.climb}`);
    if (monster.burrow) speedParts.push(`Burrow ${monster.burrow}`);
    if (monster.teleport) speedParts.push(`Teleport ${monster.teleport}`);

    const passives: { type: string; name: string; desc: string }[] = [
      ...(monster.family?.abilities?.map((passive) => ({
        type: "single",
        name: passive.name,
        desc: passive.description,
      })) || []),
      ...(monster.abilities?.map((ability) => ({
        type: "single",
        name: ability.name,
        desc: ability.description,
      })) || []),
    ];

    const actions = monster.actions?.map((a) => ({
      type: "single",
      name: a.name,
      desc: [a.damage, a.description].join(" "),
    }));

    const lvl = monster.legendary
      ? `Level ${monster.level} Solo`
      : `Lvl ${monster.level}`;
    const cr = [lvl, formatSizeKind(monster)].join(" ");

    const nimbrewData: {
      name: string;
      CR: string;
      armor: string;
      hp: string;
      saves?: string;
      speed: string;
      passives: { type: string; name: string; desc: string }[];
      actions: {
        type: string;
        name: string;
        desc?: string;
        actions?: { type: string; name: string; desc: string }[];
      }[];
      theme: object;
      bloodied?: string;
      laststand?: string;
    } = {
      name: monster.name,
      CR: cr,
      armor:
        monster.armor === "medium" ? "M" : monster.armor === "heavy" ? "H" : "",
      hp: monster.hp.toString(),
      saves: monster.saves,
      speed: speedParts.join(", "),
      passives: passives,
      actions:
        monster.actions?.length > 1
          ? [
              {
                type: "multi",
                name: monster.actionPreface,
                desc: "",
                actions: actions,
              },
            ]
          : actions || [],
      theme: {
        BGColor: "#f2ebda",
        BGOpacity: "1",
        passiveBGColor: "#d8d2c2",
        textColor: "#000000",
        accentColor: "#555555",
        borderOpacity: "1",
      },
    };

    if (monster.legendary) {
      if (monster.bloodied) {
        nimbrewData.bloodied = monster.bloodied;
      }
      if (monster.lastStand) {
        nimbrewData.laststand = monster.lastStand;
      }
    }

    const response = NextResponse.json(nimbrewData);

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  }
);
