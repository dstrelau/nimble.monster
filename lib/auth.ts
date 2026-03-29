import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import "next-auth/jwt";
import { getDatabase } from "./db/drizzle";
import { users } from "./db/schema";
import type { User } from "./types";

declare module "next-auth" {
  interface Session {
    user: User & { role?: string | null };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    discordId?: string;
    username?: string;
    displayName: string;
    image?: string;
    role?: string | null;
    bannerDismissed?: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Discord({
      // Documentation:
      // > That means you only have to override part of the options that you
      // > need to be different. For example if you want different scopes,
      // > overriding authorization.params.scope is enough, instead of the whole
      // > authorization option.
      // Reality: you have to override the whole authorization option >_>
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: { scope: "identify" },
      },
    }),
  ],
  callbacks: {
    signIn: async ({ profile }) => {
      if (profile?.username === "nimble-co") {
        return false;
      }
      if (profile?.id) {
        const db = getDatabase();
        await db
          .insert(users)
          .values({
            discordId: profile.id,
            username: (profile.username as string) || "",
            displayName: (profile.global_name as string) || "",
            avatar: (profile.avatar as string) || null,
          })
          .onConflictDoUpdate({
            target: users.discordId,
            set: {
              username: (profile.username as string) || "",
              displayName: (profile.global_name as string) || "",
              avatar: (profile.avatar as string) || null,
              imageUrl: (profile.image_url as string) || null,
            },
          });
      }
      return true;
    },
    async jwt(params) {
      const token = params.token;
      if (params.profile?.id) {
        token.discordId = params.profile.id;

        try {
          const db = getDatabase();
          const results = await db
            .select()
            .from(users)
            .where(eq(users.discordId, params.profile.id))
            .limit(1);
          const user = results[0];
          if (user) {
            token.userId = user.id;
            token.username = user.username ?? undefined;
            token.displayName = user.displayName || user.username || "";
            token.avatar = user.avatar ?? undefined;
            token.imageUrl = user.imageUrl ?? undefined;
            token.role = user.role;
            token.bannerDismissed = user.bannerDismissed ?? false;
          }
        } catch {}
      } else if (token.discordId) {
        try {
          const db = getDatabase();
          const results = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.discordId, token.discordId as string))
            .limit(1);
          const user = results[0];
          if (user) {
            token.role = user.role;
          }
        } catch {}
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId || "";
      session.user.discordId = token.discordId || "";
      if (token.username) {
        session.user.username = token.username;
      }
      if (token.displayName) {
        session.user.displayName = token.displayName;
      }
      session.user.imageUrl =
        token.imageUrl || token.avatar
          ? `https://cdn.discordapp.com/avatars/${token.discordId}/${token.avatar}.png`
          : "https://cdn.discordapp.com/embed/avatars/0.png";
      session.user.role = token.role;
      session.user.bannerDismissed = token.bannerDismissed ?? false;
      return session;
    },
  },
});

export async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "admin";
}

export async function getAuthenticatedUser(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.discordId) {
    return null;
  }
  
  return session.user;
}