import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { handlers } from "@/lib/auth";
import { getDatabase } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";

const { GET: authGET, POST } = handlers;

async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (
    url.searchParams.has("dev-login") &&
    process.env.NODE_ENV === "development"
  ) {
    const username = url.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const db = getDatabase();
    const results = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    const user = results[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = await encode({
      token: {
        userId: user.id,
        discordId: user.discordId ?? undefined,
        username: user.username ?? undefined,
        displayName: user.displayName || user.username || "",
        role: user.role,
        avatar: user.avatar ?? undefined,
        imageUrl: user.imageUrl ?? undefined,
        bannerDismissed: user.bannerDismissed ?? false,
      },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    });

    const cookieStore = await cookies();
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.redirect(new URL("/", request.url));
  }

  return authGET(request);
}

export { GET, POST };
