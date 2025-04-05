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

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Discord],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub || "";
      return session;
    },
  },
});
