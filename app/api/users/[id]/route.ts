import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { apiRedirect, jsonApiError, jsonApiHeaders } from "@/lib/api";
import { getUserById } from "@/lib/db/user";
import { toJsonApiUser } from "@/lib/services/users/converters";
import { telemetry } from "@/lib/telemetry";
import { deslugify, uuidToIdentifier } from "@/lib/utils/slug";

const notFound = () => jsonApiError(404, "User not found");

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
      return notFound();
    }

    const identifier = uuidToIdentifier(uid);
    if (id !== identifier) {
      return apiRedirect(_request, `/api/users/${identifier}`);
    }

    try {
      const user = await getUserById(uid);

      if (!user) {
        return notFound();
      }

      span?.setAttributes({ "user.id": user.id });

      const data = toJsonApiUser(user);

      return NextResponse.json({ data }, { headers: jsonApiHeaders() });
    } catch (error) {
      span?.setAttributes({ error: String(error) });
      return notFound();
    }
  }
);
