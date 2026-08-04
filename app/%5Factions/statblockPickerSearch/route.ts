import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  paginateMyHazards,
  paginatePublicHazards,
} from "@/lib/services/hazards";
import { itemsService } from "@/lib/services/items";
import { monstersService } from "@/lib/services/monsters";
import { telemetry } from "@/lib/telemetry";
import {
  type StatblockPickerSearchInput,
  statblockPickerSearchSchema,
} from "./contract";

export const POST = telemetry(async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = statblockPickerSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid picker search" },
      { status: 400 }
    );
  }

  const input: StatblockPickerSearchInput = parsed.data;
  const session = input.scope === "mine" ? await auth() : null;
  const userId = session?.user?.id ?? "";
  if (input.scope === "mine" && !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    switch (input.kind) {
      case "monsters": {
        const params = {
          cursor: input.cursor,
          limit: input.limit,
          sort: input.sort,
          search: input.search,
          type: input.type,
          source: input.source,
          role: input.role,
          level: input.level,
        };
        const result =
          input.scope === "mine"
            ? await monstersService.paginateMyMonsters(userId, params)
            : await monstersService.paginatePublicMonsters({
                ...params,
                creatorId: input.creatorId,
              });
        return NextResponse.json({ kind: "monsters", ...result });
      }
      case "hazards": {
        const params = {
          cursor: input.cursor,
          limit: input.limit,
          sort: input.sort,
          search: input.search,
          source: input.source,
          level: input.level,
        };
        const result =
          input.scope === "mine"
            ? await paginateMyHazards(userId, params)
            : await paginatePublicHazards({
                ...params,
                creatorId: input.creatorId,
              });
        return NextResponse.json({ kind: "hazards", ...result });
      }
      case "items": {
        const params = {
          cursor: input.cursor,
          limit: input.limit,
          sort: input.sort,
          search: input.search,
          rarity: input.rarity,
          source: input.source,
        };
        const result =
          input.scope === "mine"
            ? await itemsService.paginateMyItems(userId, params)
            : await itemsService.paginatePublicItems({
                ...params,
                creatorId: input.creatorId,
              });
        return NextResponse.json({ kind: "items", ...result });
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not search content",
      },
      { status: 400 }
    );
  }
});
