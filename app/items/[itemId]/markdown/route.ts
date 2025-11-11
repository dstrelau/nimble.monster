import { trace } from "@opentelemetry/api";
import { permanentRedirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { itemToMarkdown } from "@/lib/export/markdown";
import { itemsService } from "@/lib/services/items";
import { telemetry } from "@/lib/telemetry";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getItemMarkdownUrl } from "@/lib/utils/url";

export const GET = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ itemId: string }> }
  ) => {
    const { itemId } = await params;
    const span = trace.getActiveSpan();
    span?.setAttributes({ "params.itemId": itemId });

    const uid = deslugify(itemId);
    if (!uid) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const item = await itemsService.getItem(uid);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (itemId !== slugify(item)) {
      return permanentRedirect(getItemMarkdownUrl(item));
    }

    if (item.visibility !== "public") {
      const session = await auth();
      const isOwner =
        session?.user?.discordId === item.creator?.discordId || false;
      if (!isOwner) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
    }

    span?.setAttributes({ "item.id": item.id });

    const markdown = itemToMarkdown(item);

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": "inline",
      },
    });
  }
);
