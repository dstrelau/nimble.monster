import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { jsonApiHeaders, parseInclude } from "@/lib/api";
import { listPublicCustomRules } from "@/lib/db/custom-rule";
import { toJsonApiCustomRule } from "@/lib/services/customRules/converters";
import { collectCreators } from "@/lib/services/users/converters";
import { telemetry } from "@/lib/telemetry";

export const GET = telemetry(async (request: Request) => {
  const span = trace.getActiveSpan();
  const { searchParams } = new URL(request.url);

  const includeResult = parseInclude(searchParams, ["creator"]);
  if (!includeResult.ok) {
    return includeResult.response;
  }
  const includeCreator = includeResult.resources.includes("creator");

  const rules = await listPublicCustomRules();
  const data = rules.map(toJsonApiCustomRule);

  span?.setAttributes({ "params.count": data.length });

  const response: {
    data: typeof data;
    included?: ReturnType<typeof collectCreators>;
  } = { data };

  if (includeCreator) {
    response.included = collectCreators(rules);
  }

  return NextResponse.json(response, { headers: jsonApiHeaders() });
});
