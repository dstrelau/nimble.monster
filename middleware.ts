import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const { nextUrl, auth: session } = request;
  const path = nextUrl.pathname;

  if (
    path.startsWith("/my/monsters") ||
    path.startsWith("/my/collections") ||
    path.startsWith("/my/families")
  ) {
    if (!session) {
      return Response.redirect(new URL("/api/auth/signin", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/my/:path*"]
};
