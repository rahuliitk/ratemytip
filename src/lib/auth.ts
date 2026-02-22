import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ─── Admin credential login ───
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const admin = await db.adminUser.findUnique({
          where: { email: credentials.email as string, isActive: true },
        });
        if (!admin) return null;

        const isValid = await compare(
          credentials.password as string,
          admin.passwordHash
        );
        if (!isValid) return null;

        await db.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          userType: "admin" as const,
          role: admin.role,
        };
      },
    }),

    // ─── User credential login ───
    CredentialsProvider({
      id: "user-login",
      name: "User Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
        if (!user.isActive) return null;
        if (user.isBanned) return null;
        if (!user.passwordHash) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          userType: "user" as const,
          role: user.role,
          username: user.username,
        };
      },
    }),

    // ─── Google OAuth ───
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, find or create the User record
      if (account?.provider === "google") {
        if (!user.email) return false;

        let existingUser = await db.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Auto-create user from Google OAuth
          const baseUsername = user.email
            .split("@")[0]!
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .toLowerCase()
            .slice(0, 25);

          // Ensure unique username
          let username = baseUsername;
          let suffix = 1;
          while (await db.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${suffix}`;
            suffix++;
          }

          existingUser = await db.user.create({
            data: {
              email: user.email,
              emailVerified: new Date(),
              displayName: user.name ?? username,
              username,
              avatarUrl: user.image ?? null,
            },
          });
        }

        if (!existingUser.isActive || existingUser.isBanned) return false;

        // Upsert the OAuth account link
        await db.oAuthAccount.upsert({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
          create: {
            userId: existingUser.id,
            provider: "google",
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token ?? null,
            refreshToken: account.refresh_token ?? null,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
          update: {
            accessToken: account.access_token ?? null,
            refreshToken: account.refresh_token ?? null,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
        });

        // Enrich the user object so JWT callback can pick it up
        user.id = existingUser.id;
        user.userType = "user";
        user.role = existingUser.role;
        user.username = existingUser.username;
        user.name = existingUser.displayName;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.role = user.role;

        if (user.userType === "admin") {
          token.adminId = user.id;
        } else {
          token.userId = user.id;
          token.username = user.username;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.userType = token.userType ?? "user";
        session.user.role = token.role ?? "CONSUMER";

        if (token.userType === "admin") {
          session.user.adminId = token.adminId;
        } else {
          session.user.userId = token.userId;
          session.user.username = token.username;
        }
      }
      return session;
    },
  },
});
