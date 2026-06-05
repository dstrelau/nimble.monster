import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import {
  apiRedirect,
  jsonApiError,
  jsonApiHeaders,
  parseInclude,
} from "@/lib/api";
import { auth } from "@/lib/auth";
import { toJsonApiFamily } from "@/lib/services/families/converters";
import { monstersService } from "@/lib/services/monsters";
import { toJsonApiMonster } from "@/lib/services/monsters/converters";
import { toJsonApiUser } from "@/lib/services/users/converters";
import { telemetry } from "@/lib/telemetry";
import { deslugify, uuidToIdentifier } from "@/lib/utils/slug";

export const GET = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const span = trace.getActiveSpan();
    const { searchParams } = new URL(_request.url);

    span?.setAttributes({ "params.id": id });

    const includeResult = parseInclude(searchParams, ["families", "creator"]);
    if (!includeResult.ok) {
      return includeResult.response;
    }
    const includeFamilies = includeResult.resources.includes("families");
    const includeCreator = includeResult.resources.includes("creator");

    const uid = deslugify(id);
    if (!uid) {
      return jsonApiError(404, "Monster not found");
    }

    const identifier = uuidToIdentifier(uid);
    if (id !== identifier) {
      return apiRedirect(_request, `/api/monsters/${identifier}`);
    }

    try {
      const monster = await monstersService.getPublicMonster(uid);

      if (!monster) {
        return jsonApiError(404, "Monster not found");
      }

      span?.setAttributes({ "monster.id": monster.id });

      const data = toJsonApiMonster(monster);

      const included: Array<
        ReturnType<typeof toJsonApiFamily> | ReturnType<typeof toJsonApiUser>
      > = [];

      if (includeFamilies) {
        included.push(...(monster.families ?? []).map(toJsonApiFamily));
      }

      if (includeCreator) {
        included.push(toJsonApiUser(monster.creator));
      }

      const response: {
        data: typeof data;
        included?: typeof included;
      } = { data };

      if (included.length > 0) {
        response.included = included;
      }

      return NextResponse.json(response, { headers: jsonApiHeaders() });
    } catch (error) {
      span?.setAttributes({ error: String(error) });
      return jsonApiError(404, "Monster not found");
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
    if (!uid) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    span?.setAttributes({ "user.id": session.user.id });

    const existingMonster = await monstersService.getMonster(uid);

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

    await monstersService.deleteMonster(
      existingMonster.id,
      session.user.discordId ?? ""
    );

    return new NextResponse(null, { status: 204 });
  }
);
