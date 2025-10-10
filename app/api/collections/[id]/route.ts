import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  toJsonApiCollection,
  toJsonApiCollectionWithMonsters,
} from "@/lib/services/collections/converters";
import * as repository from "@/lib/services/collections/repository";
import { telemetry } from "@/lib/telemetry";
import { deslugify } from "@/lib/utils/slug";

const CONTENT_TYPE = "application/vnd.api+json";

const querySchema = z.object({
  include: z.string().optional(),
});

export const GET = telemetry(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const span = trace.getActiveSpan();
    const { searchParams } = new URL(_request.url);

    span?.setAttributes({ "params.id": id });

    const queryResult = querySchema.safeParse({
      include: searchParams.get("include") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          errors: [
            {
              status: "400",
              title: "Invalid query parameter",
            },
          ],
        },
        { status: 400, headers: { "Content-Type": CONTENT_TYPE } }
      );
    }

    const { include } = queryResult.data;

    if (include && include !== "monsters") {
      return NextResponse.json(
        {
          errors: [
            {
              status: "400",
              title: "Invalid include parameter. Only 'monsters' is supported.",
            },
          ],
        },
        { status: 400, headers: { "Content-Type": CONTENT_TYPE } }
      );
    }

    try {
      const uid = deslugify(id);
      const collection = await repository.findPublicCollectionById(uid);

      if (!collection) {
        return NextResponse.json(
          {
            errors: [
              {
                status: "404",
                title: "Collection not found",
              },
            ],
          },
          { status: 404, headers: { "Content-Type": CONTENT_TYPE } }
        );
      }

      span?.setAttributes({
        "collection.id": collection.id,
        "collection.include": include || "none",
      });

      if (include === "monsters") {
        const response = toJsonApiCollectionWithMonsters(collection);
        return NextResponse.json(response, {
          headers: {
            "Content-Type": CONTENT_TYPE,
          },
        });
      }

      const data = toJsonApiCollection(collection);
      return NextResponse.json(
        { data },
        {
          headers: {
            "Content-Type": CONTENT_TYPE,
          },
        }
      );
    } catch (error) {
      span?.setAttributes({ error: String(error) });
      return NextResponse.json(
        {
          errors: [
            {
              status: "404",
              title: "Collection not found",
            },
          ],
        },
        { status: 404, headers: { "Content-Type": CONTENT_TYPE } }
      );
    }
  }
);
