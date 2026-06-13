import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function isLockedOut(email: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
    const failures = await prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    });
    return failures >= MAX_ATTEMPTS;
  } catch {
    return false; // never block login if table fails
  }
}

async function recordAttempt(email: string, success: boolean) {
  try {
    await prisma.loginAttempt.create({ data: { email, success, ip: null } });
  } catch {
    // ignore — logging is non-critical
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.role = u.role;
        token.id = u.id;
        token.agencyId = u.agencyId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).agencyId = token.agencyId ?? null;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
          const password = credentials?.password as string | undefined;
          if (!email || !password) return null;

          const locked = await isLockedOut(email);
          if (locked) {
            await recordAttempt(email, false);
            throw new Error("Account locked");
          }

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash) {
            await recordAttempt(email, false);
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          await recordAttempt(email, valid);

          if (!valid || !user.active) return null;

          // Log successful login (non-blocking)
          prisma.securityLog.create({
            data: {
              agencyId: user.agencyId ?? null,
              userId: user.id,
              event: "LOGIN_OK",
              email: user.email,
            },
          }).catch(() => {});

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            agencyId: user.agencyId ?? null,
          } as any;
        } catch (err: any) {
          // Re-throw lockout error so NextAuth shows the right message
          if (err?.message === "Account locked") throw err;
          console.error("[auth] authorize error:", err?.message ?? err);
          return null;
        }
      },
    }),
  ],
});
