import { trace } from "@opentelemetry/api";
import { permanentRedirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  monsterToBriefMarkdown,
  monsterToMarkdown,
} from "@/lib/export/markdown";
import { monstersService } from "@/lib/services/monsters";
import { telemetry } from "@/lib/telemetry";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getMonsterMarkdownUrl } from "@/lib/utils/url";

export const GET = telemetry(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: monsterId } = await params;
    const span = trace.getActiveSpan();
    span?.setAttributes({ "params.id": monsterId });

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    const uid = deslugify(monsterId);
    if (!uid) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    const monster = await monstersService.getMonster(uid);

    if (!monster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }

    if (monsterId !== slugify(monster)) {
      const redirectUrl = getMonsterMarkdownUrl(monster);
      const redirectWithFormat = format
        ? `${redirectUrl}?format=${format}`
        : redirectUrl;
      return permanentRedirect(redirectWithFormat);
    }

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

    const markdown =
      format === "brief"
        ? monsterToBriefMarkdown(monster)
        : monsterToMarkdown(monster);

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": "inline",
      },
    });
  }
);
