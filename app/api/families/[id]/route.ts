import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";
import { getFamily } from "@/lib/db/family";
import { toJsonApiFamily } from "@/lib/services/families/converters";
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
              title: "Family not found",
            },
          ],
        },
        { status: 404, headers }
      );
    }

    try {
      const family = await getFamily(uid);

      if (!family) {
        const headers = new Headers({ "Content-Type": CONTENT_TYPE });
        addCorsHeaders(headers);
        return NextResponse.json(
          {
            errors: [
              {
                status: "404",
                title: "Family not found",
              },
            ],
          },
          { status: 404, headers }
        );
      }

      span?.setAttributes({ "family.id": family.id });

      const data = toJsonApiFamily(family);

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
              title: "Family not found",
            },
          ],
        },
        { status: 404, headers }
      );
    }
  }
);
