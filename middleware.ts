import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/my/monsters") ||
    path.startsWith("/my/collections") ||
    path.startsWith("/my/families")
  ) {
    const sessionCookie = request.cookies.get("session_id");

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
});

export const middleware = auth;
