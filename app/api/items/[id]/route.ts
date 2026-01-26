import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addCorsHeaders } from "@/lib/cors";
import { itemsService } from "@/lib/services/items";
import { toJsonApiItem } from "@/lib/services/items/converters";
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
              title: "Item not found",
            },
          ],
        },
        { status: 404, headers }
      );
    }

    try {
      const item = await itemsService.getPublicItem(uid);

      if (!item) {
        const headers = new Headers({ "Content-Type": CONTENT_TYPE });
        addCorsHeaders(headers);
        return NextResponse.json(
          {
            errors: [
              {
                status: "404",
                title: "Item not found",
              },
            ],
          },
          { status: 404, headers }
        );
      }

      span?.setAttributes({ "item.id": item.id });

      const data = toJsonApiItem(item);

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
              title: "Item not found",
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
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    const span = trace.getActiveSpan();

    span?.setAttributes({ "params.id": id });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    span?.setAttributes({ "user.id": session.user.id });

    const existingItem = await itemsService.getItem(uid);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (existingItem.creator.discordId !== session.user.discordId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this item" },
        { status: 403 }
      );
    }

    span?.setAttributes({ "item.id": existingItem.id });

    await itemsService.deleteItem(
      existingItem.id,
      session.user.discordId ?? ""
    );

    return new NextResponse(null, { status: 204 });
  }
);
