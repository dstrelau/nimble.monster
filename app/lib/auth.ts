import NextAuth, { DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import "next-auth/jwt";

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
    jwt(params) {
      const token = params.token;
      if (params.profile && params.profile.id) {
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
