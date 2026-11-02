import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { internalAction } from "@/lib/internal-action";

const inputSchema = z.strictObject({});

export const POST = internalAction("application/json", async (request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!inputSchema.safeParse(body).success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Auth.js validates the callback origin and writes the OAuth cookies.
  // Returning its URL avoids throwing a Next.js redirect through the boundary.
  const url: string = await signIn("discord", {
    redirect: false,
    redirectTo: request.headers.get("referer") || "/",
  });
  return NextResponse.json(
    { url },
    { headers: { "Cache-Control": "private, no-store" } }
  );
});
