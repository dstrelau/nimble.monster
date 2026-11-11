import { LibsqlError } from "@libsql/client";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { auth } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";

/**
 * Internal `/_actions` JSON mutation restricted to admins: same-origin and
 * media-type checks, then admin authorization, then body validation.
 */
export function adminJsonAction<Schema extends z.ZodType>(
  schema: Schema,
  handler: (input: z.infer<Schema>) => Promise<NextResponse>
) {
  return internalAction("application/json", async (request: Request) => {
    const denied = await requireAdmin();
    if (denied) return denied;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    return handler(parsed.data);
  });
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function isSqliteConstraint(
  error: unknown,
  code: "SQLITE_CONSTRAINT_UNIQUE" | "SQLITE_CONSTRAINT_FOREIGNKEY"
): boolean {
  return (
    error instanceof Error &&
    error.cause instanceof LibsqlError &&
    error.cause.extendedCode === code
  );
}
