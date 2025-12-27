import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "repo gist workflow delete_repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        // Store GitHub User ID (providerAccountId) for license verification
        token.userId = account.providerAccountId;
      }
      // Also try to get from profile if available
      if (profile?.id) {
        token.userId = String(profile.id);
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      // Add GitHub User ID to session.user
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
