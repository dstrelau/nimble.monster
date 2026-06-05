import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import {
  apiRedirect,
  jsonApiError,
  jsonApiHeaders,
  parseInclude,
} from "@/lib/api";
import {
  toJsonApiCollection,
  toJsonApiCollectionWithBoth,
  toJsonApiCollectionWithItems,
  toJsonApiCollectionWithMonsters,
} from "@/lib/services/collections/converters";
import * as repository from "@/lib/services/collections/repository";
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

    const includeResult = parseInclude(searchParams, [
      "monsters",
      "items",
      "creator",
    ]);
    if (!includeResult.ok) {
      return includeResult.response;
    }
    const includeResources = includeResult.resources;

    const uid = deslugify(id);
    if (!uid) {
      return jsonApiError(404, "Collection not found");
    }

    const identifier = uuidToIdentifier(uid);
    if (id !== identifier) {
      return apiRedirect(_request, `/api/collections/${identifier}`);
    }

    try {
      const collection = await repository.findPublicCollectionById(uid);

      if (!collection) {
        return jsonApiError(404, "Collection not found");
      }

      span?.setAttributes({
        "collection.id": collection.id,
        "collection.include": includeResources.join(",") || "none",
      });

      const includeMonsters = includeResources.includes("monsters");
      const includeItems = includeResources.includes("items");
      const includeCreator = includeResources.includes("creator");

      const headers = jsonApiHeaders();

      const creatorIncluded = includeCreator
        ? [toJsonApiUser(collection.creator)]
        : [];

      if (includeMonsters && includeItems) {
        const { data, included } = toJsonApiCollectionWithBoth(collection);
        return NextResponse.json(
          { data, included: [...included, ...creatorIncluded] },
          { headers }
        );
      }

      if (includeMonsters) {
        const { data, included } = toJsonApiCollectionWithMonsters(collection);
        return NextResponse.json(
          { data, included: [...included, ...creatorIncluded] },
          { headers }
        );
      }

      if (includeItems) {
        const { data, included } = toJsonApiCollectionWithItems(collection);
        return NextResponse.json(
          { data, included: [...included, ...creatorIncluded] },
          { headers }
        );
      }

      const data = toJsonApiCollection(collection);
      if (creatorIncluded.length > 0) {
        return NextResponse.json(
          { data, included: creatorIncluded },
          { headers }
        );
      }
      return NextResponse.json({ data }, { headers });
    } catch (error) {
      span?.setAttributes({ error: String(error) });
      return jsonApiError(404, "Collection not found");
    }
  }
);
