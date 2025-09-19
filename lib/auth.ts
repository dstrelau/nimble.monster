import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import "next-auth/jwt";
import { prisma } from "./db";
import type { User } from "./types";

declare module "next-auth" {
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    discordId?: string;
    username?: string;
    displayName: string;
    image?: string;
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
      if (profile?.id) {
        await prisma.user.upsert({
          where: { discordId: profile.id },
          update: {
            username: (profile.username as string) || "",
            displayName: (profile.global_name as string) || "",
            avatar: (profile.avatar as string) || null,
            imageUrl: (profile.image_url as string) || null,
          },
          create: {
            discordId: profile.id,
            username: (profile.username as string) || "",
            displayName: (profile.global_name as string) || "",
            avatar: (profile.avatar as string) || null,
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
          const user = await prisma.user.findUnique({
            where: { discordId: params.profile.id },
          });
          if (user) {
            token.userId = user.id;
            token.username = user.username;
            token.displayName = user.displayName || user.username;
            token.avatar = user.avatar || undefined;
            token.imageUrl = user.imageUrl || undefined;
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
      return session;
    },
  },
});
