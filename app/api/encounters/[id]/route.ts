import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import {
  apiRedirect,
  jsonApiError,
  jsonApiHeaders,
  parseInclude,
} from "@/lib/api";
import {
  toJsonApiEncounter,
  toJsonApiEncounterWithMonsters,
} from "@/lib/services/encounters/converters";
import * as repository from "@/lib/services/encounters/repository";
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

    const includeResult = parseInclude(searchParams, ["monsters", "creator"]);
    if (!includeResult.ok) {
      return includeResult.response;
    }
    const includeResources = includeResult.resources;

    const uid = deslugify(id);
    if (!uid) {
      return jsonApiError(404, "Encounter not found");
    }

    const identifier = uuidToIdentifier(uid);
    if (id !== identifier) {
      return apiRedirect(_request, `/api/encounters/${identifier}`);
    }

    try {
      const encounter = await repository.findPublicEncounterById(uid);

      if (!encounter) {
        return jsonApiError(404, "Encounter not found");
      }

      span?.setAttributes({
        "encounter.id": encounter.id,
        "encounter.include": includeResources.join(",") || "none",
      });

      const includeMonsters = includeResources.includes("monsters");
      const includeCreator = includeResources.includes("creator");

      const headers = jsonApiHeaders();

      const creatorIncluded = includeCreator
        ? [toJsonApiUser(encounter.creator)]
        : [];

      if (includeMonsters) {
        const { data, included } = toJsonApiEncounterWithMonsters(encounter);
        return NextResponse.json(
          { data, included: [...included, ...creatorIncluded] },
          { headers }
        );
      }

      const data = toJsonApiEncounter(encounter);
      if (creatorIncluded.length > 0) {
        return NextResponse.json(
          { data, included: creatorIncluded },
          { headers }
        );
      }
      return NextResponse.json({ data }, { headers });
    } catch (error) {
      span?.setAttributes({ error: String(error) });
      return jsonApiError(404, "Encounter not found");
    }
  }
);
