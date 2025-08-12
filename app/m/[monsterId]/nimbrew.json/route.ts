import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { findPublicMonsterById } from "@/lib/db";
import { telemetry } from "@/lib/telemetry";
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
    if (monster.speed) speedParts.push(monster.speed.toString());
    if (monster.fly) speedParts.push(`Fly ${monster.fly}`);
    if (monster.swim) speedParts.push(`Swim ${monster.swim}`);
    
    const nimbrewData: any = {
      name: monster.name,
      CR: monster.level,
      armor: monster.armor === "none" ? "" : monster.armor,
      hp: monster.hp.toString(),
      saves: monster.saves,
      speed: speedParts.join(", "),
      passives: monster.abilities?.map(ability => ({
        type: "single",
        name: ability.name,
        desc: ability.description
      })) || [],
      actions: monster.actionPreface ? [
        {
          type: "multi",
          name: monster.actionPreface,
          desc: "",
          actions: monster.actions?.map(action => ({
            type: "single",
            name: action.name,
            desc: action.description
          })) || []
        }
      ] : monster.actions?.map(action => ({
        type: "single",
        name: action.name,
        desc: action.description,
        status: false
      })) || [],
      theme: {
        BGColor: "#f2ebda",
        BGOpacity: "1",
        passiveBGColor: "#d8d2c2",
        textColor: "#000000",
        accentColor: "#555555",
        borderOpacity: "1"
      }
    };

    if (monster.legendary) {
      if (monster.bloodied) {
        nimbrewData.bloodied = monster.bloodied;
      }
      if (monster.lastStand) {
        nimbrewData.laststand = monster.lastStand;
      }
    }

    return NextResponse.json(nimbrewData);
  }
);
