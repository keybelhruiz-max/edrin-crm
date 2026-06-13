import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";
import bcrypt from "bcryptjs";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const users = await prisma.user.findMany({
    where: { ...agencyWhere(s), active: true },
    select: { id: true, name: true, email: true, role: true, commissionRate: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const hash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      agencyId: s.agencyId || null,
      name: body.name,
      email: body.email,
      passwordHash: hash,
      role: body.role || "VENTAS",
    },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(user);
}
