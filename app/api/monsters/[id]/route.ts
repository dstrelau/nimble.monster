import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addCorsHeaders } from "@/lib/cors";
import { monstersService } from "@/lib/services/monsters";
import { toJsonApiMonster } from "@/lib/services/monsters/converters";
import { telemetry } from "@/lib/telemetry";
import { deslugify } from "@/lib/utils/slug";

const CONTENT_TYPE = "application/vnd.api+json";

export const GET = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    const uid = deslugify(id);
    if (!uid) {
      const headers = new Headers({ "Content-Type": CONTENT_TYPE });
      addCorsHeaders(headers);
      return NextResponse.json(
        {
          errors: [
            {
              status: "404",
              title: "Monster not found",
            },
          ],
        },
        { status: 404, headers }
      );
    }

    try {
      const monster = await monstersService.getPublicMonster(uid);

      if (!monster) {
        const headers = new Headers({ "Content-Type": CONTENT_TYPE });
        addCorsHeaders(headers);
        return NextResponse.json(
          {
            errors: [
              {
                status: "404",
                title: "Monster not found",
              },
            ],
          },
          { status: 404, headers }
        );
      }

      span?.setAttributes({ "monster.id": monster.id });

      const data = toJsonApiMonster(monster);

      const headers = new Headers({ "Content-Type": CONTENT_TYPE });
      addCorsHeaders(headers);
      return NextResponse.json({ data }, { headers });
    } catch (error) {
      span?.setAttributes({ error: String(error) });
      const headers = new Headers({ "Content-Type": CONTENT_TYPE });
      addCorsHeaders(headers);
      return NextResponse.json(
        {
          errors: [
            {
              status: "404",
              title: "Monster not found",
            },
          ],
        },
        { status: 404, headers }
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
