import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import {
  apiRedirect,
  jsonApiError,
  jsonApiHeaders,
  parseInclude,
} from "@/lib/api";
import { itemsService } from "@/lib/services/items";
import { toJsonApiItem } from "@/lib/services/items/converters";
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

    const includeResult = parseInclude(searchParams, ["creator"]);
    if (!includeResult.ok) {
      return includeResult.response;
    }
    const includeCreator = includeResult.resources.includes("creator");

    const uid = deslugify(id);
    if (!uid) {
      return jsonApiError(404, "Item not found");
    }

    const identifier = uuidToIdentifier(uid);
    if (id !== identifier) {
      return apiRedirect(_request, `/api/items/${identifier}`);
    }

    try {
      const item = await itemsService.getPublicItem(uid);

      if (!item) {
        return jsonApiError(404, "Item not found");
      }

      span?.setAttributes({ "item.id": item.id });

      const data = toJsonApiItem(item);

      const response: {
        data: typeof data;
        included?: ReturnType<typeof toJsonApiUser>[];
      } = { data };

      if (includeCreator) {
        response.included = [toJsonApiUser(item.creator)];
      }

      return NextResponse.json(response, { headers: jsonApiHeaders() });
    } catch (error) {
      span?.setAttributes({ error: String(error) });
      return jsonApiError(404, "Item not found");
    }
  }
);
