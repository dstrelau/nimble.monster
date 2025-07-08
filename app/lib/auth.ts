import NextAuth, { type DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import "next-auth/jwt";
import { prisma } from "./db";

declare module "next-auth" {
  interface Session {
    user: {
      /** The unique Discord-provided ID. */
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
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
            avatar: (profile.avatar as string) || null,
          },
          create: {
            discordId: profile.id,
            username: (profile.username as string) || "",
            avatar: (profile.avatar as string) || null,
          },
        });
      }
      return true;
    },
    jwt(params) {
      const token = params.token;
      if (params.profile?.id) {
        token.id = params.profile.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id || "";
      return session;
    },
  },
});
