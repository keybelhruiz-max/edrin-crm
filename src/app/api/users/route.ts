import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const users = await prisma.user.findMany({
      where: { ...agencyWhere(s), active: true },
      select: { id: true, name: true, email: true, role: true, commissionRate: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const body = await req.json();
    if (!body.name?.trim() || !body.email?.trim() || !body.password) {
      return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
    if (existing) return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    const hash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        agencyId: s.agencyId || null,
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        passwordHash: hash,
        role: body.role || "VENTAS",
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
