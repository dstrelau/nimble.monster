import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addCorsHeaders } from "@/lib/cors";
import {
  toJsonApiCollection,
  toJsonApiCollectionWithBoth,
  toJsonApiCollectionWithItems,
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
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const span = trace.getActiveSpan();
    const { searchParams } = new URL(_request.url);

    span?.setAttributes({ "params.id": id });

    const queryResult = querySchema.safeParse({
      include: searchParams.get("include") || undefined,
    });

    if (!queryResult.success) {
      const headers = new Headers({ "Content-Type": CONTENT_TYPE });
      addCorsHeaders(headers);
      return NextResponse.json(
        {
          errors: [
            {
              status: "400",
              title: "Invalid query parameter",
            },
          ],
        },
        { status: 400, headers }
      );
    }

    const { include } = queryResult.data;

    const includeResources = include
      ? include.split(",").map((r) => r.trim())
      : [];
    const validIncludes = new Set(["monsters", "items"]);
    const invalidIncludes = includeResources.filter(
      (r) => !validIncludes.has(r)
    );

    if (invalidIncludes.length > 0) {
      const headers = new Headers({ "Content-Type": CONTENT_TYPE });
      addCorsHeaders(headers);
      return NextResponse.json(
        {
          errors: [
            {
              status: "400",
              title: `Invalid include parameter. Only 'monsters' and 'items' are supported.`,
            },
          ],
        },
        { status: 400, headers }
      );
    }

    try {
      const uid = deslugify(id);
      const collection = await repository.findPublicCollectionById(uid);

      if (!collection) {
        const headers = new Headers({ "Content-Type": CONTENT_TYPE });
        addCorsHeaders(headers);
        return NextResponse.json(
          {
            errors: [
              {
                status: "404",
                title: "Collection not found",
              },
            ],
          },
          { status: 404, headers }
        );
      }

      span?.setAttributes({
        "collection.id": collection.id,
        "collection.include": include || "none",
      });

      const includeMonsters = includeResources.includes("monsters");
      const includeItems = includeResources.includes("items");

      const headers = new Headers({ "Content-Type": CONTENT_TYPE });
      addCorsHeaders(headers);

      if (includeMonsters && includeItems) {
        const response = toJsonApiCollectionWithBoth(collection);
        return NextResponse.json(response, { headers });
      }

      if (includeMonsters) {
        const response = toJsonApiCollectionWithMonsters(collection);
        return NextResponse.json(response, { headers });
      }

      if (includeItems) {
        const response = toJsonApiCollectionWithItems(collection);
        return NextResponse.json(response, { headers });
      }

      const data = toJsonApiCollection(collection);
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
              title: "Collection not found",
            },
          ],
        },
        { status: 404, headers }
      );
    }
  }
);
