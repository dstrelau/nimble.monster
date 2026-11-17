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

  if (
    !session &&
    process.env.NODE_ENV === "development" &&
    process.env.NIMBLE_DEV_AUTO_LOGIN_USERNAME &&
    request.method === "GET" &&
    !path.startsWith("/api/") &&
    !path.startsWith("/_actions/") &&
    path !== "/dev-login"
  ) {
    const url = new URL("/api/auth/dev-login", process.env.AUTH_URL ?? nextUrl);
    url.searchParams.set("dev-login", "");
    url.searchParams.set(
      "username",
      process.env.NIMBLE_DEV_AUTO_LOGIN_USERNAME
    );
    return NextResponse.redirect(url);
  }

  // Protect /my/* routes
  if (path.startsWith("/my/")) {
    if (!session) {
      return Response.redirect(new URL("/api/auth/signin", nextUrl));
    }
  }

  // Next.js reads the nonce from this request header and adds it to its own
  // inline scripts; the root layout reads x-nonce for ours.
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_HEADER, policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, policy);
  return response;
});

// Report-only while we collect violations from production; switch to
// Content-Security-Policy to enforce it.
const CSP_HEADER = "Content-Security-Policy-Report-Only";

function contentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets nonced scripts (Next.js chunks, the Amp feedback
    // widget) load further scripts, and ignores host allowlists.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.discordapp.com https://*.fly.storage.tigris.dev",
    "font-src 'self' data:",
    "connect-src 'self' https://ampcode.com",
    "frame-src https://ampcode.com",
    "object-src 'none'",
    "base-uri 'self'",
    // Discord sign-in posts to /api/auth and redirects to discord.com.
    "form-action 'self' https://discord.com",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ].join("; ");
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const HTTP_METHOD_BODY_RE = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) \//;
const IMAGE_ROUTE_RE = /^\/(?:monsters|items|companions)\/[^/]+\/image$/;
const BLOCKED_IMAGE_BOT_USER_AGENTS = [/ahrefsbot/i, /amazonbot/i, /bingbot/i];

function isBlockedImageBot(request: NextRequest): boolean {
  if (!IMAGE_ROUTE_RE.test(request.nextUrl.pathname)) return false;

  const userAgent = request.headers.get("user-agent") ?? "";
  return BLOCKED_IMAGE_BOT_USER_AGENTS.some((pattern) =>
    pattern.test(userAgent)
  );
}

function isAllowedServerActionOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "nimble.nexus" ||
      hostname === "localhost" ||
      allowedOrigins.some(
        (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
      )
    );
  } catch {
    return false;
  }
}

function matchesRequestHost(origin: string, request: NextRequest): boolean {
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function isSameOriginBrowserRequest(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") !== "same-origin") return false;

  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    return new URL(referer).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  // These crawlers request every dynamic entity image, which triggers an
  // expensive Chromium render. Keep regular users and social preview bots
  // eligible to fetch images.
  if (request.method === "GET" && isBlockedImageBot(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Reject bot POSTs to page routes: require next-action header and a
  // matching origin (bots scrape next-action IDs but send spoofed origins,
  // causing Next.js "Invalid Server Actions request" 500s).
  // This runs outside auth() because next-auth/Next.js may short-circuit
  // requests with next-action headers before the auth callback executes.
  if (
    request.method === "POST" &&
    !request.nextUrl.pathname.startsWith("/api/") &&
    !request.nextUrl.pathname.startsWith("/_actions/")
  ) {
    const origin = request.headers.get("origin") ?? "";
    if (
      !request.headers.get("next-action") ||
      !(
        isAllowedServerActionOrigin(origin) ||
        matchesRequestHost(origin, request) ||
        (!origin && isSameOriginBrowserRequest(request))
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
