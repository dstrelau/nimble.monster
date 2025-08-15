import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { findPublicMonsterById } from "@/lib/db";
import { telemetry } from "@/lib/telemetry";
import { formatSizeKind } from "@/lib/utils/monster";
import { isValidUUID } from "@/lib/utils/validation";

export const GET = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ monsterId: string }> }
  ) => {
    const { monsterId } = await params;
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": monsterId });

    if (!isValidUUID(monsterId)) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    const monster = await findPublicMonsterById(monsterId);

    if (!monster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    span?.setAttributes({ "monster.id": monster.id });

    const speedParts = [];
    if (monster.speed && monster.speed != 6)
      speedParts.push(monster.speed.toString());
    if (monster.fly) speedParts.push(`Fly ${monster.fly}`);
    if (monster.swim) speedParts.push(`Swim ${monster.swim}`);

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

    const lvl = monster.legendary
      ? `Level ${monster.level} Solo`
      : `Lvl ${monster.level}`;
    const cr = [lvl, formatSizeKind(monster)].join(" ");

    const nimbrewData: any = {
      name: monster.name,
      CR: cr,
      armor:
        monster.armor === "medium" ? "M" : monster.armor === "heavy" ? "H" : "",
      hp: monster.hp.toString(),
      saves: monster.saves,
      speed: speedParts.join(", "),
      passives: passives,
      actions: monster.actionPreface
        ? [
            {
              type: "multi",
              name: "ACTIONS",
              desc: monster.actionPreface,
              actions: monster.actions?.map((action) => ({
                type: "multi",
                name: monster.actionPreface,
                desc: "",
                actions:
                  monster.actions?.map((action) => ({
                    type: "single",
                    name: action.name,
                    desc: [action.damage, action.description].join(" "),
                    status: false,
                  })) || [],
              })),
            },
          ]
        : monster.actions?.map((action) => ({
            type: "single",
            name: action.name,
            desc: [action.damage, action.description].join(" "),
            status: false,
          })) || [],
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
