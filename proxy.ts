import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((request) => {
  const { nextUrl, auth: session } = request;

  // Reject bot POSTs to page routes: require next-action header and a
  // matching origin (bots scrape next-action IDs but send spoofed origins,
  // causing Next.js "Invalid Server Actions request" 500s).
  if (request.method === "POST" && !nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") ?? "";
    if (
      !request.headers.get("next-action") ||
      !origin.includes("nimble.nexus")
    ) {
      return new Response("Bad Request", { status: 400 });
    }
  }

  const hostname = request.headers.get("host") || "";

  // Redirect old domain to new domain
  if (hostname.includes("nimble.monster")) {
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
