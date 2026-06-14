import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, unauthorizedResponse } from "@/lib/agency";
import bcrypt from "bcryptjs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: { id, agencyId: s.agencyId || undefined },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, commissionRate: true },
    });
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.user.findFirst({ where: { id, agencyId: s.agencyId || undefined } });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.role !== undefined) data.role = body.role;
    if (body.active !== undefined) data.active = body.active;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    // Update commission rate if provided
    if (body.commissionRate !== undefined) {
      await prisma.commissionRate.upsert({
        where: { userId: id },
        create: { userId: id, rate: parseFloat(body.commissionRate) || 5 },
        update: { rate: parseFloat(body.commissionRate) || 5 },
      });
    }

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { id } = await params;

    const existing = await prisma.user.findFirst({ where: { id, agencyId: s.agencyId || undefined } });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Soft delete — just deactivate
    await prisma.user.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
