import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveEntityReferences } from "@/lib/services/entity-references";
import { telemetry } from "@/lib/telemetry";
import {
  ENTITY_REFERENCE_BATCH_SIZE,
  ENTITY_TYPES,
} from "@/lib/types/entity-links";

const requestsSchema = z
  .array(
    z.object({
      type: z.enum(ENTITY_TYPES),
      id: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-zA-Z0-9-]+$/),
    })
  )
  .min(1)
  .max(ENTITY_REFERENCE_BATCH_SIZE);

const headers = { "Cache-Control": "private, no-store" };

export const GET = telemetry(async (request: Request) => {
  const values = new URL(request.url).searchParams.getAll("reference");
  const result = requestsSchema.safeParse(
    values.map((value) => {
      const colon = value.indexOf(":");
      return {
        type: colon < 0 ? "" : value.slice(0, colon),
        id: value.slice(colon + 1),
      };
    })
  );
  if (!result.success) {
    return NextResponse.json(
      {
        error: `Provide 1–${ENTITY_REFERENCE_BATCH_SIZE} valid type:ID reference parameters.`,
      },
      { status: 400, headers }
    );
  }

  try {
    const references = await resolveEntityReferences(result.data);
    trace.getActiveSpan()?.setAttributes({
      "references.requested": result.data.length,
      "references.resolved": references.length,
    });
    return NextResponse.json({ references }, { headers });
  } catch (error) {
    trace
      .getActiveSpan()
      ?.recordException(error instanceof Error ? error : String(error));
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers }
    );
  }
});
