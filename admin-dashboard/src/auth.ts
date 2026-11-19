import {
  countRecentFailures,
  findAdminByEmail,
  recordLoginAttempt,
  touchLastLogin,
} from "@repo/db/admin";
import { hashPassword, verifyPassword } from "@repo/db/password";
import { isIdle, isLockedOut, SESSION } from "@repo/shared";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

declare module "next-auth" {
  interface User {
    sessionVersion?: number;
    mustChangePassword?: boolean;
  }
  interface Session {
    mustChangePassword?: boolean;
    /** Compared with admin_users.session_version on every request (revocation). */
    sessionVersion?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    sv?: number;
    mcp?: boolean;
    lastSeen?: number;
  }
}

class InvalidLogin extends CredentialsSignin {
  override code = "invalid";
}
class LockedLogin extends CredentialsSignin {
  override code = "locked";
}

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase().max(200),
  password: z.string().min(1).max(200),
});

// A real argon2 hash verified when the email doesn't exist, so timing doesn't reveal valid accounts.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password-placeholder"));

function clientIp(request: Request): string | null {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip") || null;
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION.maxAgeSec, updateAge: 5 * 60 },
  pages: { signIn: "/login", error: "/login" },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-admin.session" : "admin.session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidLogin();
        const { email, password } = parsed.data;
        const ip = clientIp(request);

        if (isLockedOut(await countRecentFailures(email, ip))) {
          await recordLoginAttempt({ email, ip, success: false, reason: "locked" });
          throw new LockedLogin();
        }

        const user = await findAdminByEmail(email);
        const ok = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), password);
        if (!user || !ok || !user.isActive || !user.passwordHash) {
          await recordLoginAttempt({
            email,
            ip,
            success: false,
            reason: !user ? "unknown_email" : !user.isActive ? "disabled" : "bad_password",
          });
          throw new InvalidLogin();
        }

        await recordLoginAttempt({ email, ip, success: true });
        await touchLastLogin(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          sessionVersion: user.sessionVersion,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      // `user` is only provided on sign-in.
      if (trigger === "signIn") {
        token.uid = user.id;
        token.sv = user.sessionVersion ?? 0;
        token.mcp = user.mustChangePassword ?? false;
        token.lastSeen = Date.now();
        return token;
      }
      // Idle timeout: an inactive session is dropped (returning null signs the user out).
      if (isIdle(token.lastSeen)) return null;
      token.lastSeen = Date.now();
      if (trigger === "update" && typeof session === "object" && session !== null) {
        const s = session as { mustChangePassword?: boolean; sessionVersion?: number };
        if (typeof s.mustChangePassword === "boolean") token.mcp = s.mustChangePassword;
        if (typeof s.sessionVersion === "number") token.sv = s.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      session.mustChangePassword = token.mcp ?? false;
      session.sessionVersion = token.sv;
      return session;
    },
  },
});
