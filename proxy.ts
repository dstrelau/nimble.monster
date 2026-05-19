import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const authProxy = auth((request) => {
  const { nextUrl, auth: session } = request;

  const hostname = request.headers.get("host") || "";

  // Redirect old domain to new domain, except nimbrew.json routes
  if (
    hostname.includes("nimble.monster") &&
    !nextUrl.pathname.endsWith("/nimbrew.json")
  ) {
    const url = nextUrl.clone();
    url.host = url.host.replace("nimble.monster", "nimble.nexus");
    return NextResponse.redirect(url, { status: 308 });
  }

  const path = nextUrl.pathname;

  // Protect /my/* routes
  if (path.startsWith("/my/")) {
    if (!session) {
      return Response.redirect(new URL("/api/auth/signin", nextUrl));
    }
  }

  return NextResponse.next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const HTTP_METHOD_BODY_RE = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) \//;

export default async function proxy(request: NextRequest) {
  // Reject bot POSTs to page routes: require next-action header and a
  // matching origin (bots scrape next-action IDs but send spoofed origins,
  // causing Next.js "Invalid Server Actions request" 500s).
  // This runs outside auth() because next-auth/Next.js may short-circuit
  // requests with next-action headers before the auth callback executes.
  if (
    request.method === "POST" &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    const origin = request.headers.get("origin") ?? "";
    if (
      !request.headers.get("next-action") ||
      !(
        origin.includes("nimble.nexus") ||
        origin.includes("localhost") ||
        allowedOrigins.some((allowed) => origin.includes(allowed))
      )
    ) {
      return new Response("Bad Request", { status: 400 });
    }

    // Reject crafted Server Action requests with HTTP-method-line bodies
    // (attack traffic that spoofs origin but sends malformed action payloads).
    if (request.headers.get("content-type")?.startsWith("text/plain")) {
      const body = await request.clone().text();
      if (HTTP_METHOD_BODY_RE.test(body)) {
        return new Response("Bad Request", { status: 400 });
      }
    }
  }

  return authProxy(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
