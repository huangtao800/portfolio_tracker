import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      // Allowlist check
      const allowed = process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean);
      if (!allowed || allowed.length === 0) return false;
      if (!allowed.includes(user.email ?? "")) return false;

      // Upsert user into database
      const existing = await db
        .select({ userId: users.userId })
        .from(users)
        .where(eq(users.email, user.email!))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values({
          userId: randomUUID(),
          email: user.email!,
          name: user.name ?? null,
        });
      }

      return true;
    },

    async jwt({ token }) {
      if (token.email) {
        const row = await db
          .select({ userId: users.userId })
          .from(users)
          .where(eq(users.email, token.email))
          .limit(1);

        if (row.length > 0) token.userId = row[0].userId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { userId?: string }).userId = token.userId as string;
      }
      return session;
    },
  },
};
