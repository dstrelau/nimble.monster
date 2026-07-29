import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import {
  apiRedirect,
  jsonApiError,
  jsonApiHeaders,
  parseInclude,
} from "@/lib/api";
import { findPublicCustomRule } from "@/lib/db/custom-rule";
import { toJsonApiCustomRule } from "@/lib/services/customRules/converters";
import { toJsonApiUser } from "@/lib/services/users/converters";
import { telemetry } from "@/lib/telemetry";
import { deslugify, uuidToIdentifier } from "@/lib/utils/slug";

export const GET = telemetry(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const span = trace.getActiveSpan();
    const { searchParams } = new URL(request.url);

    span?.setAttributes({ "params.id": id });

    const includeResult = parseInclude(searchParams, ["creator"]);
    if (!includeResult.ok) {
      return includeResult.response;
    }
    const includeCreator = includeResult.resources.includes("creator");

    const uid = deslugify(id);
    if (!uid) {
      return jsonApiError(404, "Custom rule not found");
    }

    const identifier = uuidToIdentifier(uid);
    if (id !== identifier) {
      return apiRedirect(request, `/api/custom-rules/${identifier}`);
    }

    const rule = await findPublicCustomRule(uid);
    if (!rule) {
      return jsonApiError(404, "Custom rule not found");
    }

    span?.setAttributes({ "custom_rule.id": rule.id });

    const data = toJsonApiCustomRule(rule);
    const response: {
      data: typeof data;
      included?: ReturnType<typeof toJsonApiUser>[];
    } = { data };

    if (includeCreator) {
      response.included = [toJsonApiUser(rule.creator)];
    }

    return NextResponse.json(response, { headers: jsonApiHeaders() });
  }
);
