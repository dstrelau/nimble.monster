import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addCorsHeaders } from "@/lib/cors";
import { getUserByUsername } from "@/lib/db/user";
import { toJsonApiUser } from "@/lib/services/users/converters";
import { telemetry } from "@/lib/telemetry";

const CONTENT_TYPE = "application/vnd.api+json";

// Users are not enumerable: the only supported query is an exact lookup by
// username, which resolves a (mutable) username to a user's stable id.
const querySchema = z.object({
  username: z.string().min(1, "username is required"),
});

export const GET = telemetry(async (request: Request) => {
  const span = trace.getActiveSpan();
  const { searchParams } = new URL(request.url);

  const result = querySchema.safeParse({
    username: searchParams.get("username") || undefined,
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    const headers = new Headers({ "Content-Type": CONTENT_TYPE });
    addCorsHeaders(headers);
    return NextResponse.json(
      {
        errors: [
          {
            status: "400",
            title: issue.message,
          },
        ],
      },
      { status: 400, headers }
    );
  }

  const { username } = result.data;

  span?.setAttributes({ "params.username": username });

  // Usernames are unique, so this returns a collection with at most one user.
  const user = await getUserByUsername(username);
  const data = user ? [toJsonApiUser(user)] : [];

  span?.setAttributes({ "params.count": data.length });

  const headers = new Headers({ "Content-Type": CONTENT_TYPE });
  addCorsHeaders(headers);
  return NextResponse.json({ data }, { headers });
});
