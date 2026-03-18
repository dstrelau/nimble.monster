import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OFFICIAL_ONLY_DOMAIN, OFFICIAL_ONLY_HEADER } from "@/lib/domain";

const OFFICIAL_ONLY_BLOCKED_PREFIXES = [
  "/create",
  "/my",
  "/admin",
  "/api/auth",
  "/u",
  "/recent",
  "/items",
  "/collections",
  "/companions",
];

const authProxy = auth((request) => {
  const { nextUrl, auth: session } = request;

  const hostname = request.headers.get("host") || "";

  // Redirect old domain to new domain
  if (hostname.includes("nimble.monster")) {
    const url = nextUrl.clone();
    url.host = url.host.replace("nimble.monster", "nimble.nexus");
    return NextResponse.redirect(url, { status: 308 });
  }

  const path = nextUrl.pathname;

  // Official-only domain: block user/auth routes and set header
  const hostnameWithoutPort = hostname.split(":")[0];
  const isOfficialOnly =
    hostnameWithoutPort === OFFICIAL_ONLY_DOMAIN ||
    hostnameWithoutPort === `www.${OFFICIAL_ONLY_DOMAIN}`;

  if (isOfficialOnly) {
    if (
      OFFICIAL_ONLY_BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix))
    ) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(OFFICIAL_ONLY_HEADER, "1");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

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

export default function proxy(request: NextRequest) {
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
        origin.includes(OFFICIAL_ONLY_DOMAIN) ||
        origin.includes("localhost") ||
        allowedOrigins.some((allowed) => origin.includes(allowed))
      )
    ) {
      return new Response("Bad Request", { status: 400 });
    }
  }

  return authProxy(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
