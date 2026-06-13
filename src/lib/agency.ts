import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type AgencySession = {
  agencyId: string;
  userId: string;
  role: string;
};

export async function getAgencySession(): Promise<AgencySession | null> {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { id?: string; agencyId?: string; role?: string };
  if (!user.id) return null;
  return {
    agencyId: user.agencyId ?? "",
    userId: user.id,
    role: user.role ?? "VENTAS",
  };
}

export async function requireAgency(): Promise<AgencySession> {
  const s = await getAgencySession();
  if (!s) throw new Response("Unauthorized", { status: 401 });
  // SUPERADMIN doesn't need agencyId scoping (they manage all agencies)
  return s;
}

export function isSuperAdmin(role: string) {
  return role === "SUPERADMIN";
}

/** Builds a Prisma `where` clause that scopes to the agency (or all for superadmin) */
export function agencyWhere(s: AgencySession) {
  if (isSuperAdmin(s.role)) return {};
  return { agencyId: s.agencyId };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
