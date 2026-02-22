import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    userType: "admin" | "user";
    role: string;
    username?: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      userType: "admin" | "user";
      role: string;
      adminId?: string;
      userId?: string;
      username?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userType?: "admin" | "user";
    role?: string;
    adminId?: string;
    userId?: string;
    username?: string;
  }
}
